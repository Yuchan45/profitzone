import { sequelize } from '../sequelize.js'
import { listNeighborhoods } from '../../services/neighborhoods.service.js'
import { expandBounds, fetchOverpass, toOverpassBbox } from './overpass.js'

function buildQuery(bounds) {
  const bbox = toOverpassBbox(bounds)
  return `[out:json][timeout:180];
    (
      nwr["amenity"~"^(restaurant|fast_food|cafe)$"](${bbox});
      nwr["leisure"="fitness_centre"](${bbox});
      nwr["sport"~"pilates",i](${bbox});
      nwr["name"~"pilates",i](${bbox});
    );
    out center tags;`
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

// Etiquetas de OSM que se guardan para la ficha del local (paso 3): nombre en la ficha → etiquetas posibles
const DETAIL_TAGS = {
  street: ['addr:street'],
  houseNumber: ['addr:housenumber'],
  openingHours: ['opening_hours'],
  phone: ['phone', 'contact:phone'],
  website: ['website', 'contact:website'],
  instagram: ['contact:instagram'],
  facebook: ['contact:facebook'],
  outdoorSeating: ['outdoor_seating'],
  delivery: ['delivery'],
  takeaway: ['takeaway'],
  wheelchair: ['wheelchair'],
}

/** JSON con los datos de la ficha que tenga el local, o null si no tiene ninguno. */
function toDetails(tags) {
  const details = {}
  for (const [key, candidates] of Object.entries(DETAIL_TAGS)) {
    const value = candidates.map((tag) => tags[tag]).find(Boolean)
    if (value) details[key] = value.slice(0, 300)
  }
  return Object.keys(details).length > 0 ? JSON.stringify(details) : null
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
    details: toDetails(tags),
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
           UPDATE SET kind = :kind, name = :name, cuisine = :cuisine, details = :details,
             geom = geography::Point(:lat, :lng, 4326), is_active = 1, last_seen_at = :seenAt
         WHEN NOT MATCHED THEN
           INSERT (osm_type, osm_id, kind, name, cuisine, details, geom, is_active, last_seen_at)
           VALUES (:osmType, :osmId, :kind, :name, :cuisine, :details, geography::Point(:lat, :lng, 4326), 1, :seenAt);`,
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
