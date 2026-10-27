import { sequelize } from '../sequelize.js'
import { listNeighborhoods } from '../../services/neighborhoods.service.js'
import { calculateDistanceMeters } from '../../utils/geo.js'
import { expandBounds, fetchOverpass, toBbox } from './overpass.js'

// Un andén de subte (stop_position) le pasa sus líneas a la estación del mismo nombre
// que esté a menos de esta distancia
const SUBWAY_PLATFORM_MAX_METERS = 400
// Si ningún andén tiene el mismo nombre, se usa el más cercano a menos de esta distancia
// que comparta alguna palabra con la estación ("Leandro N. Alem" ↔ "Alem")
const SUBWAY_NEAREST_MAX_METERS = 150

const nameWords = (name) =>
  new Set(
    (name ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 4),
  )
const sharesWord = (a, b) => {
  const words = nameWords(b)
  return [...nameWords(a)].some((word) => words.has(word))
}

// Nombre de estación para comparar con el de sus andenes: sin "(D)" ni " - Raúl Alfonsín"
const subwayBaseName = (name) =>
  name
    ?.replace(/\s*\([^)]*\)\s*$/, '')
    .split(' - ')[0]
    .trim()
    .toLowerCase() || null

// Paradas, estaciones y andenes de subte, y los recorridos (relaciones) que pasan por ellos.
// Los andenes solo se usan para saber las líneas de cada estación de subte: no se guardan.
function buildQuery(bounds) {
  const bbox = toBbox(bounds)
  return `[out:json][timeout:180];
    (
      node["highway"="bus_stop"](${bbox});
      nwr["public_transport"="platform"]["bus"="yes"](${bbox});
      nwr["railway"~"^(station|halt)$"](${bbox});
      node["public_transport"="stop_position"]["subway"="yes"](${bbox});
    )->.stops;
    .stops out center tags;
    (
      rel(bn.stops)["route"~"^(bus|subway|train)$"];
      rel(bw.stops)["route"~"^(bus|subway|train)$"];
    );
    out body;`
}

/**
 * Tipo de parada (columna `kind`), o null si no se guarda (andenes de subte, otras vías).
 * Subte antes que tren: algunas estaciones de subte también tienen train=yes.
 */
export function classifyStop(tags) {
  if (tags.public_transport === 'stop_position') return null
  if (tags.railway === 'station' || tags.railway === 'halt') {
    if (tags.station === 'subway' || tags.subway === 'yes') return 'subway'
    if (!tags.station || tags.station === 'train' || tags.train === 'yes') return 'train'
    return null
  }
  if (tags.highway === 'bus_stop' || (tags.public_transport === 'platform' && tags.bus === 'yes')) return 'bus'
  return null
}

/**
 * Número de línea de colectivo a partir del `ref` del recorrido: los ramales llevan
 * letras o sufijos ("39-3", "151C", "55SJ" → "39", "151", "55"). Sin número, null.
 */
export function busLineNumber(ref) {
  return ref?.match(/^\d+/)?.[0] ?? null
}

const memberKey = (type, id) => `${type[0]}${id}`

// Ordena números de línea de menor a mayor y el resto (letras de subte) alfabéticamente
const byLine = (a, b) => (Number(a) || Infinity) - (Number(b) || Infinity) || a.localeCompare(b)

/** Filas para osm_data.transit_stops a partir de la respuesta de Overpass. */
export function toRows(elements) {
  const stops = elements.filter((element) => element.type !== 'relation')
  const routes = elements.filter((element) => element.type === 'relation')

  // Líneas de cada elemento según los recorridos que lo tienen como miembro
  const linesByMember = new Map()
  for (const route of routes) {
    const { route: mode, ref } = route.tags ?? {}
    const line = mode === 'bus' ? busLineNumber(ref) : mode === 'subway' ? ref?.trim() || null : null
    if (!line) continue
    for (const member of route.members ?? []) {
      const key = memberKey(member.type, member.ref)
      if (!linesByMember.has(key)) linesByMember.set(key, new Set())
      linesByMember.get(key).add(line)
    }
  }

  const position = (element) => ({
    lat: element.lat ?? element.center?.lat,
    lng: element.lon ?? element.center?.lon,
  })
  const subwayPlatforms = stops.filter(
    (element) => element.tags?.public_transport === 'stop_position' && element.tags?.subway === 'yes',
  )

  const rows = []
  for (const element of stops) {
    const tags = element.tags ?? {}
    const kind = classifyStop(tags)
    const { lat, lng } = position(element)
    if (!kind || lat === undefined || lng === undefined) continue

    const lines = new Set(linesByMember.get(memberKey(element.type, element.id)) ?? [])
    if (kind === 'subway') {
      // Estaciones de combinación: la línea va en el nombre ("Callao (D)")
      const ownLine = tags.name?.match(/\(([A-H])\)\s*$/)?.[1]
      if (ownLine) lines.add(ownLine)
      // Si no, las líneas están en los andenes: los del mismo nombre (sin el agregado
      // " - Raúl Alfonsín") y cerca, o si no hay, el más cercano
      const baseName = subwayBaseName(tags.name)
      let nearest = null
      for (const platform of ownLine ? [] : subwayPlatforms) {
        const at = position(platform)
        const distance = calculateDistanceMeters(lat, lng, at.lat, at.lng)
        if (distance > SUBWAY_PLATFORM_MAX_METERS) continue
        const platformLines = linesByMember.get(memberKey(platform.type, platform.id)) ?? []
        if (baseName && subwayBaseName(platform.tags.name) === baseName) {
          for (const line of platformLines) lines.add(line)
        }
        if (
          distance <= SUBWAY_NEAREST_MAX_METERS &&
          sharesWord(tags.name, platform.tags.name) &&
          (!nearest || distance < nearest.distance)
        ) {
          nearest = { distance, lines: platformLines }
        }
      }
      if (lines.size === 0 && nearest) for (const line of nearest.lines) lines.add(line)
    }
    if (kind === 'train' && tags.network) lines.add(tags.network.replace(/^(?:l[ií]nea|tren)\s+/i, '').trim())

    rows.push({
      osmType: element.type[0],
      osmId: element.id,
      kind,
      name: tags.name?.slice(0, 200) ?? null,
      lines: lines.size > 0 ? [...lines].sort(byLine).join(',').slice(0, 400) : null,
      lat,
      lng,
    })
  }
  return rows
}

/**
 * Carga en osm_data.transit_stops las paradas de colectivo y estaciones de subte y tren
 * de OSM del barrio disponible (+2 km). Idempotente: actualiza por (osm_type, osm_id).
 * No borra: las que ya no están en OSM quedan con is_active = 0.
 */
export async function seedOsmTransit() {
  const [neighborhood] = await listNeighborhoods()
  if (!neighborhood) throw new Error('No hay barrios disponibles: corré antes npm run db:seed:census.')

  const elements = await fetchOverpass(buildQuery(expandBounds(neighborhood.bounds)))
  const rows = toRows(elements)
  const runStartedAt = new Date()

  const stats = { received: elements.length, saved: 0, withLines: 0, deactivated: 0 }
  const byKind = {}

  await sequelize.transaction(async (transaction) => {
    for (const row of rows) {
      await sequelize.query(
        `MERGE osm_data.transit_stops AS target
         USING (SELECT :osmType AS osm_type, :osmId AS osm_id) AS source
         ON target.osm_type = source.osm_type AND target.osm_id = source.osm_id
         WHEN MATCHED THEN
           UPDATE SET kind = :kind, name = :name, lines = :lines,
             geom = geography::Point(:lat, :lng, 4326), is_active = 1, last_seen_at = :seenAt
         WHEN NOT MATCHED THEN
           INSERT (osm_type, osm_id, kind, name, lines, geom, is_active, last_seen_at)
           VALUES (:osmType, :osmId, :kind, :name, :lines, geography::Point(:lat, :lng, 4326), 1, :seenAt);`,
        { replacements: { ...row, seenAt: runStartedAt }, transaction },
      )
      stats.saved++
      if (row.lines) stats.withLines++
      byKind[row.kind] = (byKind[row.kind] ?? 0) + 1
    }

    const [, affected] = await sequelize.query(
      `UPDATE osm_data.transit_stops SET is_active = 0 WHERE is_active = 1 AND last_seen_at < :seenAt`,
      { replacements: { seenAt: runStartedAt }, transaction },
    )
    stats.deactivated = typeof affected === 'number' ? affected : 0
  })

  return { ...stats, ...byKind }
}
