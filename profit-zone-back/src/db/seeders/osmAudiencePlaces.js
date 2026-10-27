import { sequelize } from '../sequelize.js'
import { listNeighborhoods } from '../../services/neighborhoods.service.js'
import { expandBounds, fetchOverpass, toOverpassBbox } from './overpass.js'

export function buildAudienceQuery(bounds) {
  const bbox = toOverpassBbox(bounds)
  return `[out:json][timeout:180];
    (
      nwr["amenity"~"^(kindergarten|school|university|college|coworking_space|hospital|clinic|doctors)$"](${bbox});
      nwr["leisure"="playground"](${bbox});
      nwr["office"](${bbox});
      nwr["social_facility:for"~"senior"](${bbox});
      nwr["healthcare"~"^(hospital|clinic|doctor|centre)$"](${bbox});
    );
    out center tags;`
}

/**
 * Tipo de lugar (columna `kind`, ver utils/audiencePlaces.js) o null si no atrae a
 * ningún público del catálogo. El orden importa: un coworking suele estar etiquetado
 * como `office` y un centro de jubilados como `social_facility`.
 */
export function classifyAudiencePlace(tags) {
  if (/senior/i.test(tags['social_facility:for'] ?? '')) return 'senior_center'
  if (tags.amenity === 'coworking_space' || tags.office === 'coworking') return 'coworking'
  if (tags.amenity === 'kindergarten') return 'kindergarten'
  if (tags.amenity === 'school') return 'school'
  if (tags.amenity === 'university' || tags.amenity === 'college') return 'university'
  if (['hospital', 'clinic', 'doctors'].includes(tags.amenity)) return 'healthcare'
  if (['hospital', 'clinic', 'doctor', 'centre'].includes(tags.healthcare)) return 'healthcare'
  if (tags.leisure === 'playground') return 'playground'
  if (tags.office) return 'office'
  return null
}

function toRow(element) {
  const tags = element.tags ?? {}
  const kind = classifyAudiencePlace(tags)
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
  if (!kind || lat === undefined || lng === undefined) return null
  return {
    osmType: element.type[0],
    osmId: element.id,
    kind,
    name: tags.name?.slice(0, 200) ?? null,
    lat,
    lng,
  }
}

/**
 * Carga en osm_data.audience_places los lugares de OSM que atraen a cada público,
 * en el barrio disponible (+2 km). Idempotente: actualiza por (osm_type, osm_id).
 * No borra: los que ya no están en OSM quedan con is_active = 0.
 */
export async function seedOsmAudiencePlaces() {
  const [neighborhood] = await listNeighborhoods()
  if (!neighborhood) throw new Error('No hay barrios disponibles: corré antes npm run db:seed:census.')

  const elements = await fetchOverpass(buildAudienceQuery(expandBounds(neighborhood.bounds)))
  const rows = elements.map(toRow).filter(Boolean)
  const runStartedAt = new Date()

  const stats = { received: elements.length, saved: 0, deactivated: 0 }
  const byKind = {}

  await sequelize.transaction(async (transaction) => {
    for (const row of rows) {
      await sequelize.query(
        `MERGE osm_data.audience_places AS target
         USING (SELECT :osmType AS osm_type, :osmId AS osm_id) AS source
         ON target.osm_type = source.osm_type AND target.osm_id = source.osm_id
         WHEN MATCHED THEN
           UPDATE SET kind = :kind, name = :name, geom = geography::Point(:lat, :lng, 4326),
             is_active = 1, last_seen_at = :seenAt
         WHEN NOT MATCHED THEN
           INSERT (osm_type, osm_id, kind, name, geom, is_active, last_seen_at)
           VALUES (:osmType, :osmId, :kind, :name, geography::Point(:lat, :lng, 4326), 1, :seenAt);`,
        { replacements: { ...row, seenAt: runStartedAt }, transaction },
      )
      stats.saved++
      byKind[row.kind] = (byKind[row.kind] ?? 0) + 1
    }

    const [, affected] = await sequelize.query(
      `UPDATE osm_data.audience_places SET is_active = 0 WHERE is_active = 1 AND last_seen_at < :seenAt`,
      { replacements: { seenAt: runStartedAt }, transaction },
    )
    stats.deactivated = typeof affected === 'number' ? affected : 0
  })

  return { ...stats, ...byKind }
}
