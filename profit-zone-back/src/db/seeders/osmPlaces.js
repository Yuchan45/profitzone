import { sequelize } from '../sequelize.js'
import { listNeighborhoods } from '../../services/neighborhoods.service.js'

const PREFIX = '[ProfitZone]'

// Servidores públicos de Overpass (gratis, sin clave). Suelen estar saturados:
// se prueban en orden y se reintenta varias rondas antes de fallar.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
const ROUNDS = 3
const RETRY_DELAY_MS = 10_000
const REQUEST_TIMEOUT_MS = 200_000

// Margen alrededor del barrio: cubre el radio máximo del paso 3 (2 km) desde el borde
const MARGIN_METERS = 2100
const METERS_PER_DEGREE_LAT = 111_320

/** Rectángulo del barrio agrandado `MARGIN_METERS` hacia cada lado. */
function expandBounds({ south, west, north, east }) {
  const dLat = MARGIN_METERS / METERS_PER_DEGREE_LAT
  const midLat = ((south + north) / 2) * (Math.PI / 180)
  const dLng = MARGIN_METERS / (METERS_PER_DEGREE_LAT * Math.cos(midLat))
  return { south: south - dLat, west: west - dLng, north: north + dLat, east: east + dLng }
}

function buildQuery({ south, west, north, east }) {
  const bbox = [south, west, north, east].map((n) => n.toFixed(6)).join(',')
  return `[out:json][timeout:180];
    (
      nwr["amenity"~"^(restaurant|fast_food|cafe)$"](${bbox});
      nwr["leisure"="fitness_centre"](${bbox});
      nwr["sport"~"pilates",i](${bbox});
      nwr["name"~"pilates",i](${bbox});
    );
    out center tags;`
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchOverpass(query) {
  let lastError = null
  for (let round = 1; round <= ROUNDS; round++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        console.log(`${PREFIX} Consultando Overpass (${new URL(endpoint).host}, ronda ${round})...`)
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'ProfitZone (proyecto UADE)',
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
        if (!response.ok) throw new Error(`respondió ${response.status}`)
        const body = await response.json()
        // Con la consulta cortada por timeout, Overpass responde 200 con un "remark"
        if (body.remark) throw new Error(body.remark)
        return body.elements ?? []
      } catch (error) {
        lastError = error
        console.warn(`${PREFIX} Overpass falló: ${error.message}`)
      }
    }
    if (round < ROUNDS) await wait(RETRY_DELAY_MS)
  }
  throw new Error(`Ningún servidor de Overpass respondió: ${lastError?.message}`)
}

/**
 * Tipo normalizado del negocio (columna `kind`), o null si no es de un rubro del MVP.
 * Pilates va antes que gimnasio: un estudio de pilates suele estar etiquetado como fitness_centre.
 */
export function classifyPlace(tags) {
  if (/pilates/i.test(tags.sport ?? '') || /pilates/i.test(tags.name ?? '')) return 'pilates'
  if (tags.amenity === 'restaurant') return 'restaurant'
  if (tags.amenity === 'fast_food') return 'fast_food'
  if (tags.amenity === 'cafe') return 'cafe'
  if (tags.leisure === 'fitness_centre') return 'fitness'
  return null
}

function toRow(element) {
  const tags = element.tags ?? {}
  const kind = classifyPlace(tags)
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
  if (!kind || lat === undefined || lng === undefined) return null
  return {
    osmType: element.type[0],
    osmId: element.id,
    kind,
    name: tags.name?.slice(0, 200) ?? null,
    cuisine: tags.cuisine?.toLowerCase().slice(0, 200) ?? null,
    lat,
    lng,
  }
}

/**
 * Carga en osm_data.places los negocios de OSM del barrio disponible (+2 km).
 * Idempotente: actualiza por (osm_type, osm_id). No borra: los que ya no están en
 * OSM quedan con is_active = 0.
 */
export async function seedOsmPlaces() {
  const [neighborhood] = await listNeighborhoods()
  if (!neighborhood) throw new Error('No hay barrios disponibles: corré antes npm run db:seed:census.')

  const bounds = expandBounds(neighborhood.bounds)
  const elements = await fetchOverpass(buildQuery(bounds))
  const rows = elements.map(toRow).filter(Boolean)
  const runStartedAt = new Date()

  const stats = { received: elements.length, saved: 0, deactivated: 0 }
  const byKind = {}

  await sequelize.transaction(async (transaction) => {
    for (const row of rows) {
      await sequelize.query(
        `MERGE osm_data.places AS target
         USING (SELECT :osmType AS osm_type, :osmId AS osm_id) AS source
         ON target.osm_type = source.osm_type AND target.osm_id = source.osm_id
         WHEN MATCHED THEN
           UPDATE SET kind = :kind, name = :name, cuisine = :cuisine,
             geom = geography::Point(:lat, :lng, 4326), is_active = 1, last_seen_at = :seenAt
         WHEN NOT MATCHED THEN
           INSERT (osm_type, osm_id, kind, name, cuisine, geom, is_active, last_seen_at)
           VALUES (:osmType, :osmId, :kind, :name, :cuisine, geography::Point(:lat, :lng, 4326), 1, :seenAt);`,
        { replacements: { ...row, seenAt: runStartedAt }, transaction },
      )
      stats.saved++
      byKind[row.kind] = (byKind[row.kind] ?? 0) + 1
    }

    const [, affected] = await sequelize.query(
      `UPDATE osm_data.places SET is_active = 0 WHERE is_active = 1 AND last_seen_at < :seenAt`,
      { replacements: { seenAt: runStartedAt }, transaction },
    )
    stats.deactivated = typeof affected === 'number' ? affected : 0
  })

  return { ...stats, ...byKind }
}
