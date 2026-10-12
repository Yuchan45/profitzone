import { sequelize } from '../db/sequelize.js'
import { wktToLatLngPolygons } from '../utils/wkt.js'
import { isPointInPolygons } from '../utils/geo.js'

// Barrios donde se puede analizar (MVP: solo Palermo, PZ-15). `censusName` es
// el valor de census_data.census_radios.barrio.
const AVAILABLE_NEIGHBORHOODS = [{ code: 'palermo', name: 'Palermo', censusName: 'PALERMO' }]

// Tolerancia en metros para simplificar el contorno que se manda al mapa
const BOUNDARY_TOLERANCE_M = 15
// Achicar y volver a agrandar el contorno borra las astillas finas que deja la
// unión de radios (ej. junto al Aeroparque) y conserva el 99,7% del área
const BOUNDARY_OPENING_M = 25

// El contorno sale de unir los radios censales: no cambia mientras corre la API
let cachedNeighborhoods = null

// Rectángulo que contiene todos los anillos: { south, west, north, east }
function boundsOf(polygons) {
  const points = polygons.flat(2)
  const lats = points.map(([lat]) => lat)
  const lngs = points.map(([, lng]) => lng)
  return {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  }
}

async function loadNeighborhood({ code, name, censusName }) {
  // El centro se pondera por población: el centro geométrico de Palermo cae en
  // los Bosques y el Aeroparque, lejos de donde están los comercios
  const [rows] = await sequelize.query(
    `SELECT
       geography::UnionAggregate(geom).STBuffer(:shrink).STBuffer(:opening).Reduce(:tolerance).STAsText() AS wkt,
       SUM(geom.EnvelopeCenter().Lat * poblacion) / NULLIF(SUM(poblacion), 0) AS centerLat,
       SUM(geom.EnvelopeCenter().Long * poblacion) / NULLIF(SUM(poblacion), 0) AS centerLng
     FROM census_data.census_radios
     WHERE barrio = :censusName`,
    { replacements: { censusName, tolerance: BOUNDARY_TOLERANCE_M, opening: BOUNDARY_OPENING_M, shrink: -BOUNDARY_OPENING_M } },
  )
  const { wkt, centerLat, centerLng } = rows[0]
  if (!wkt) return null

  const boundary = wktToLatLngPolygons(wkt)
  return {
    code,
    name,
    center: { lat: centerLat, lng: centerLng },
    bounds: boundsOf(boundary),
    boundary,
  }
}

/**
 * Barrios disponibles con su contorno ([lat, lng]) y centro, para el mapa del paso 3.
 * Si el censo no está cargado, el barrio no aparece.
 */
export async function listNeighborhoods() {
  if (!cachedNeighborhoods) {
    const loaded = await Promise.all(AVAILABLE_NEIGHBORHOODS.map(loadNeighborhood))
    const available = loaded.filter(Boolean)
    // Sin censo cargado no se cachea, para que aparezca apenas se cargue
    if (available.length === 0) return []
    cachedNeighborhoods = available
  }
  return cachedNeighborhoods
}

/** Nombres de los barrios disponibles para los mensajes ("Palermo", "Palermo o Belgrano"). */
export function availableNeighborhoodNames() {
  return AVAILABLE_NEIGHBORHOODS.map((n) => n.name).join(' o ')
}

/**
 * Barrio disponible que contiene el punto, o null si cae fuera de todos. Usa el
 * mismo contorno simplificado que muestra el mapa, para que el front y la API
 * coincidan en los bordes.
 */
export async function findAvailableNeighborhood(lat, lng) {
  const neighborhoods = await listNeighborhoods()
  return neighborhoods.find((n) => isPointInPolygons({ lat, lng }, n.boundary)) ?? null
}
