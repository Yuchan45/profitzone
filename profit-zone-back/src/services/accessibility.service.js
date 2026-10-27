import { sequelize } from '../db/sequelize.js'
import { calculateDistanceMeters, formatDistance } from '../utils/geo.js'

const CATEGORY_LABELS = {
  subway: 'Subte',
  train: 'Tren',
  bus: 'Colectivo',
}

// Subte y tren primero (pesan más para llegar), después las paradas de colectivo
const CATEGORY_PRIORITY = { subway: 1, train: 2, bus: 3 }

// Elementos de OSM que son la misma parada o estación: mismo tipo y nombre a menos de esta
// distancia. En una esquina hay una parada por vereda (y a veces el andén y el poste por
// separado); una estación tiene un punto por andén o por línea.
const GROUP_METERS = { bus: 80, subway: 300, train: 300 }
// Paradas sin nombre: solo se juntan las que están prácticamente en el mismo lugar
const UNNAMED_GROUP_METERS = 25

const normalizeName = (name) =>
  (name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// Ordena números de línea de menor a mayor y el resto (letras de subte) alfabéticamente
const byLine = (a, b) => (Number(a) || Infinity) - (Number(b) || Infinity) || a.localeCompare(b)

/** Texto de las líneas: "Líneas 39, 55 y 151", "Línea D", "Tren San Martín" o null. */
function linesText(category, lines) {
  if (lines.length === 0) return null
  const list = lines.length === 1 ? lines[0] : `${lines.slice(0, -1).join(', ')} y ${lines.at(-1)}`
  if (category === 'train') return `Tren ${list}`
  return `${lines.length === 1 ? 'Línea' : 'Líneas'} ${list}`
}

/**
 * Junta los elementos de OSM de una misma parada o estación (vienen ordenados por
 * distancia, así cada grupo queda con el punto más cercano y suma las líneas de todos).
 */
function groupStops(rows) {
  const groups = []
  for (const row of rows) {
    const key = normalizeName(row.name)
    const maxMeters = key ? GROUP_METERS[row.kind] : UNNAMED_GROUP_METERS
    const group = groups.find(
      (candidate) =>
        candidate.kind === row.kind &&
        candidate.key === key &&
        calculateDistanceMeters(candidate.lat, candidate.lng, row.lat, row.lng) <= maxMeters,
    )
    const lines = row.lines ? row.lines.split(',') : []
    if (group) {
      for (const line of lines) group.lines.add(line)
    } else {
      groups.push({ ...row, key, lines: new Set(lines) })
    }
  }
  return groups
}

/** Paradas de colectivo y estaciones de subte y tren de osm_data.transit_stops en el radio. */
async function findTransitStops({ lat, lng, radiusInMeters }) {
  const [rows] = await sequelize.query(
    `DECLARE @point geography = geography::Point(:lat, :lng, 4326);
     SELECT id, kind, name, lines, geom.Lat AS lat, geom.Long AS lng,
       geom.STDistance(@point) AS distance, last_seen_at AS lastSeenAt
     FROM osm_data.transit_stops
     WHERE is_active = 1 AND geom.STDistance(@point) <= :radius
     ORDER BY geom.STDistance(@point)`,
    { replacements: { lat, lng, radius: radiusInMeters } },
  )
  return rows
}

/**
 * Genera un texto explicativo (callout) sobre la accesibilidad de la zona.
 */
function generateAccessibilityCallout({ total, subwayCount, trainCount, busCount, closestSubway, closestTrain }) {
  if (total === 0) {
    return 'Zona con baja conectividad de transporte público registrado en el radio.'
  }
  const railParts = []
  if (subwayCount > 0) {
    railParts.push(`subte a ${closestSubway.distanceMeters} m`)
  }
  if (trainCount > 0) {
    railParts.push(`tren a ${closestTrain.distanceMeters} m`)
  }
  if (railParts.length > 0) {
    return `Excelente conectividad con ${railParts.join(' y ')} más ${busCount} ${busCount === 1 ? 'parada' : 'paradas'} de colectivo en la zona.`
  }
  return `Conectividad con ${busCount} ${busCount === 1 ? 'parada' : 'paradas'} de colectivo en el radio.`
}

/**
 * Obtiene el análisis de accesibilidad y transporte público para un punto y radio, con
 * las paradas de colectivo y estaciones de subte y tren de OpenStreetMap
 * (osm_data.transit_stops, `npm run db:seed:osm-transit`): gratis y con las líneas que
 * paran en cada una. Cada parada o estación cuenta una vez aunque OSM la tenga en
 * varios puntos (una por vereda, un andén por línea).
 */
export async function getAccessibilityAnalysis({ lat, lng, radiusInMeters = 1000 }) {
  const rows = await findTransitStops({ lat, lng, radiusInMeters })

  const places = groupStops(rows)
    .map((stop) => {
      const lines = [...stop.lines].sort(byLine)
      const distanceMeters = Math.round(stop.distance)
      const stationName = stop.kind === 'bus' ? null : stop.name && `Est. ${stop.name}`
      return {
        id: `transit-${stop.id}`,
        name: stop.name,
        cleanName: stationName ?? stop.name ?? 'Parada de colectivo',
        category: stop.kind,
        type: CATEGORY_LABELS[stop.kind],
        lines: linesText(stop.kind, lines),
        lineCount: lines.length,
        distanceMeters,
        distanceText: formatDistance(distanceMeters),
        location: { lat: stop.lat, lng: stop.lng },
      }
    })
    .sort(
      (a, b) =>
        CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category] || a.distanceMeters - b.distanceMeters,
    )

  const subwayCount = places.filter((p) => p.category === 'subway').length
  const trainCount = places.filter((p) => p.category === 'train').length
  const busCount = places.filter((p) => p.category === 'bus').length
  // Líneas de colectivo distintas que pasan por el radio
  const busLines = new Set(rows.filter((row) => row.kind === 'bus' && row.lines).flatMap((row) => row.lines.split(',')))

  const total = places.length
  const byDistance = [...places].sort((a, b) => a.distanceMeters - b.distanceMeters)
  const closestPlace = byDistance[0] || null
  const closestSubway = places.find((p) => p.category === 'subway') || null
  const closestTrain = places.find((p) => p.category === 'train') || null

  let level = 'baja'
  if (subwayCount > 0 || trainCount > 0 || total >= 6) {
    level = 'alta'
  } else if (total >= 2) {
    level = 'media'
  }

  const callout = generateAccessibilityCallout({
    total,
    subwayCount,
    trainCount,
    busCount,
    closestSubway,
    closestTrain,
  })
  const updatedAt = rows.reduce((latest, row) => (row.lastSeenAt > latest ? row.lastSeenAt : latest), null)

  return {
    total,
    subwayCount,
    trainCount,
    busCount,
    busLineCount: busLines.size,
    otherCount: 0,
    level,
    closestPlace,
    closestSubway,
    closestTrain,
    callout,
    source: 'OpenStreetMap',
    queryDate: new Date().toISOString(),
    updatedAt,
    places,
  }
}
