import { searchNearbyPlaces } from './googlePlaces.service.js'
import { calculateDistanceMeters, formatDistance } from '../utils/geo.js'

const TRANSIT_TYPES = [
  'subway_station',
  'bus_stop',
  'train_station',
  'bus_station',
  'transit_station',
  'light_rail_station',
]

/**
 * Clasifica el tipo de transporte según sus types de Google Places.
 */
function classifyTransitType(types = [], primaryType = '') {
  const all = [primaryType, ...types].filter(Boolean)
  if (all.includes('subway_station')) return 'subway'
  if (all.includes('train_station') || all.includes('light_rail_station')) return 'train'
  if (all.includes('bus_stop') || all.includes('bus_station')) return 'bus'
  return 'other'
}

/**
 * Genera un texto explicativo (callout) sobre la accesibilidad de la zona.
 */
function generateAccessibilityCallout({ total, subwayCount, trainCount, busCount, closestSubway }) {
  if (total === 0) {
    return 'Zona con baja conectividad de transporte público registrado en el radio.'
  }
  if (subwayCount > 0) {
    const distText = closestSubway ? ` a ${closestSubway.distanceMeters} m` : ''
    return `Excelente conectividad con subte${distText} y ${busCount} ${busCount === 1 ? 'parada' : 'paradas'} de colectivo en la zona.`
  }
  if (trainCount > 0) {
    return `Buena conectividad con estación de tren y ${busCount} ${busCount === 1 ? 'parada' : 'paradas'} de transporte en el radio.`
  }
  return `Conectividad regular con ${busCount} ${busCount === 1 ? 'parada' : 'paradas'} de transporte público en el radio.`
}

/**
 * Obtiene el análisis de accesibilidad y transporte público para un punto y radio.
 * Consulta Google Places API por estaciones de subte, tren y paradas de colectivos.
 */
export async function getAccessibilityAnalysis({ lat, lng, radiusInMeters = 1000 }) {
  const rawPlaces = await searchNearbyPlaces({
    lat,
    lng,
    radiusInMeters,
    includedTypes: TRANSIT_TYPES,
    maxResultCount: 20,
  })

  let subwayCount = 0
  let trainCount = 0
  let busCount = 0
  let otherCount = 0

  const places = rawPlaces.map((p) => {
    const distanceMeters = calculateDistanceMeters(lat, lng, p.location?.lat, p.location?.lng)
    const category = classifyTransitType(p.types, p.primaryType)

    if (category === 'subway') subwayCount++
    else if (category === 'train') trainCount++
    else if (category === 'bus') busCount++
    else otherCount++

    return {
      id: p.id,
      name: p.name,
      category,
      primaryType: p.primaryType,
      distanceMeters,
      distanceText: formatDistance(distanceMeters),
      location: p.location,
    }
  })

  // Ordenar por distancia geodésica ascendente
  places.sort((a, b) => a.distanceMeters - b.distanceMeters)

  const total = places.length
  const closestPlace = places[0] || null
  const closestSubway = places.find((p) => p.category === 'subway') || null
  const closestTrain = places.find((p) => p.category === 'train') || null

  let level = 'baja'
  if (subwayCount > 0 || trainCount > 0 || total >= 8) {
    level = 'alta'
  } else if (total >= 2) {
    level = 'media'
  }

  const callout = generateAccessibilityCallout({ total, subwayCount, trainCount, busCount, closestSubway })

  return {
    total,
    subwayCount,
    trainCount,
    busCount,
    otherCount,
    level,
    closestPlace,
    closestSubway,
    closestTrain,
    callout,
    source: 'Google Places',
    queryDate: new Date().toISOString(),
    places,
  }
}

