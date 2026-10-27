import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/sequelize.js'
import { httpError } from '../utils/httpErrors.js'
import { calculateDistanceMeters, formatDistance } from '../utils/geo.js'
import { AUDIENCE_PLACE_KINDS, kindsForAudiences } from '../utils/audiencePlaces.js'

// Lugares más cercanos que se listan en el reporte
const NEAREST_PLACES = 5
// OSM a veces tiene el mismo lugar dos veces (el punto y el edificio, por ejemplo una
// escuela): mismo tipo y nombre a menos de esta distancia cuentan una sola vez
const DUPLICATE_METERS = 150

/** Saca los duplicados de OSM. `rows` viene ordenado por distancia: queda el más cercano. */
function withoutDuplicates(rows) {
  const kept = []
  for (const row of rows) {
    const name = row.name?.trim().toLocaleLowerCase('es-AR')
    const duplicate =
      name &&
      kept.some(
        (other) =>
          other.kind === row.kind &&
          other.name?.trim().toLocaleLowerCase('es-AR') === name &&
          calculateDistanceMeters(other.lat, other.lng, row.lat, row.lng) <= DUPLICATE_METERS,
      )
    if (!duplicate) kept.push(row)
  }
  return kept
}

// Se recuerda solo cuando la tabla ya tiene datos: si está vacía se vuelve a mirar
// (alguien puede correr el seed con la API levantada)
let tableHasPlaces = false

async function audiencePlacesLoaded() {
  if (tableHasPlaces) return true
  const [row] = await sequelize.query('SELECT TOP 1 1 AS found FROM osm_data.audience_places WHERE is_active = 1', {
    type: QueryTypes.SELECT,
  })
  tableHasPlaces = Boolean(row)
  return tableHasPlaces
}

/**
 * Lugares que atraen a los públicos elegidos (códigos de target_age) dentro del
 * radio, desde OpenStreetMap (osm_data.audience_places, `npm run db:seed:osm-audience`).
 * Devuelve el total, la cantidad por tipo (todos los tipos de esos públicos, aunque
 * sea 0) y los más cercanos con nombre. 503 si todavía no hay lugares cargados: sin
 * datos no se responde "0 lugares" como si fuera un dato.
 */
export async function getAudiencePlacesInRadius({ lat, lng, radiusInMeters, audiences }) {
  const kinds = kindsForAudiences(audiences)
  const base = { radiusInMeters, source: 'OpenStreetMap' }
  if (kinds.length === 0) return { ...base, total: 0, byKind: [], nearest: [], updatedAt: null }

  const found = await sequelize.query(
    `DECLARE @point geography = geography::Point(:lat, :lng, 4326);
     SELECT kind, name, geom.Lat AS lat, geom.Long AS lng,
       ROUND(geom.STDistance(@point), 0) AS distanceMeters, last_seen_at AS lastSeenAt
     FROM osm_data.audience_places
     WHERE is_active = 1 AND kind IN (:kinds) AND geom.STDistance(@point) <= :radiusInMeters
     ORDER BY distanceMeters ASC`,
    { replacements: { lat, lng, radiusInMeters, kinds }, type: QueryTypes.SELECT },
  )
  if (found.length === 0 && !(await audiencePlacesLoaded())) {
    throw httpError(503, 'Todavía no hay lugares de OpenStreetMap cargados para consultar.')
  }

  const rows = withoutDuplicates(found)
  const counts = Object.fromEntries(kinds.map((kind) => [kind, 0]))
  for (const row of rows) counts[row.kind]++
  const lastSeen = rows.map((row) => new Date(row.lastSeenAt).getTime()).filter(Number.isFinite)

  return {
    ...base,
    total: rows.length,
    byKind: kinds.map((kind) => ({ kind, label: AUDIENCE_PLACE_KINDS[kind].plural, count: counts[kind] })),
    nearest: rows
      .filter((row) => row.name)
      .slice(0, NEAREST_PLACES)
      .map((row) => ({
        name: row.name,
        kind: row.kind,
        label: AUDIENCE_PLACE_KINDS[row.kind].singular,
        distanceMeters: Number(row.distanceMeters),
        distanceText: formatDistance(Number(row.distanceMeters)),
      })),
    // Última vez que el seed vio estos lugares en OSM
    updatedAt: lastSeen.length > 0 ? new Date(Math.max(...lastSeen)).toISOString() : null,
  }
}
