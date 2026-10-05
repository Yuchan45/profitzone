import { sequelize } from '../db/sequelize.js'
import { wktToLatLngPolygons } from '../utils/wkt.js'

// Barrios donde se puede analizar (MVP: solo Palermo, PZ-15). `censusName` es
// el valor de census_data.census_radios.barrio.
const AVAILABLE_NEIGHBORHOODS = [{ code: 'palermo', name: 'Palermo', censusName: 'PALERMO' }]

// Tolerancia en metros para simplificar el contorno que se manda al mapa
const BOUNDARY_TOLERANCE_M = 15

// El contorno sale de unir los radios censales: no cambia mientras corre la API
let cachedNeighborhoods = null

async function loadNeighborhood({ code, name, censusName }) {
  const [rows] = await sequelize.query(
    `SELECT
       geography::UnionAggregate(geom).Reduce(:tolerance).STAsText() AS wkt,
       geography::UnionAggregate(geom).EnvelopeCenter().Lat AS centerLat,
       geography::UnionAggregate(geom).EnvelopeCenter().Long AS centerLng
     FROM census_data.census_radios
     WHERE barrio = :censusName`,
    { replacements: { censusName, tolerance: BOUNDARY_TOLERANCE_M } },
  )
  const { wkt, centerLat, centerLng } = rows[0]
  if (!wkt) return null

  return {
    code,
    name,
    center: { lat: centerLat, lng: centerLng },
    boundary: wktToLatLngPolygons(wkt),
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

/** Barrio disponible que contiene el punto, o null si cae fuera de todos. */
export async function findAvailableNeighborhood(lat, lng) {
  const [rows] = await sequelize.query(
    `SELECT TOP 1 barrio
     FROM census_data.census_radios
     WHERE geom.STIntersects(geography::Point(:lat, :lng, 4326)) = 1`,
    { replacements: { lat, lng } },
  )
  const barrio = rows[0]?.barrio
  return AVAILABLE_NEIGHBORHOODS.find((n) => n.censusName === barrio) ?? null
}
