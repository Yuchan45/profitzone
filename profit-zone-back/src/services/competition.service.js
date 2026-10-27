import { searchNearbyPlaces } from './googlePlaces.service.js'
import { Subcategory, SubcategorySearchTerm } from '../models/index.js'
import { calculateDistanceMeters, formatDistance } from '../utils/geo.js'
import { findNearbyPlaces, directCriteria } from './places.service.js'
import { nameMatchesCuisine, normalizeName } from '../utils/cuisineMatch.js'

export { calculateDistanceMeters, formatDistance }

/**
 * Mapeo de términos de Google Places (primario e indirectos) por subcategoría.
 */
const FALLBACK_CATEGORY_TERMS = {
  restaurante: {
    name: 'restaurantes',
    primary: 'restaurant',
    indirect: ['bar', 'fast_food_restaurant', 'meal_takeaway', 'cafe'],
  },
  cafeteria: {
    name: 'cafeterías',
    primary: 'cafe',
    indirect: ['bakery', 'coffee_shop', 'pastry_shop', 'dessert_shop'],
  },
  gimnasio: {
    name: 'gimnasios',
    primary: 'gym',
    indirect: ['fitness_center', 'sports_club'],
  },
  pilates: {
    name: 'estudios de pilates',
    primary: 'gym',
    indirect: ['fitness_center', 'sports_club'],
  },
}

/**
 * Busca si un local de Google Places se corresponde con alguno de OpenStreetMap
 * en base a proximidad geográfica y coincidencia de nombre.
 */
function findMatchingOsmPlace(googlePlace, osmPlaces) {
  if (!osmPlaces || osmPlaces.length === 0) return null

  const gNorm = normalizeName(googlePlace.name)
  const gTokens = gNorm.split(' ').filter((t) => t.length >= 3)

  let bestMatch = null
  let minDistance = Infinity

  for (const osm of osmPlaces) {
    const dist = calculateDistanceMeters(
      googlePlace.location.lat,
      googlePlace.location.lng,
      osm.lat,
      osm.lng,
    )

    if (dist > 80) continue

    const oNorm = normalizeName(osm.name)
    const oTokens = oNorm.split(' ').filter((t) => t.length >= 3)

    const substringMatch =
      oNorm.length >= 3 &&
      gNorm.length >= 3 &&
      (gNorm.includes(oNorm) || oNorm.includes(gNorm))

    const commonTokens = gTokens.filter((t) => oTokens.includes(t))
    const tokenMatch = commonTokens.length > 0

    if (substringMatch || (tokenMatch && dist <= 50)) {
      if (dist < minDistance) {
        minDistance = dist
        bestMatch = osm
      }
    }
  }

  return bestMatch
}

/**
 * Determina si un local es competencia directa o indirecta respetando la
 * categorización de OpenStreetMap y el criterio elegido por el usuario (ej: tipo de cocina).
 */
function isPlaceDirect({ place, matchedOsm, criteria, terms }) {
  const placeTypes = [place.primaryType, ...(place.types || [])].filter(Boolean)

  // 0. Si Google lo tipifica con la cocina elegida (ej. sushi_restaurant para "Asiática"),
  // es directo: la consulta pidió justamente esos tipos
  if (criteria?.googleTypes?.some((type) => placeTypes.includes(type))) {
    return true
  }

  // 1. Si coincide con un local de OSM, la categorización de OSM es la fuente de verdad
  if (matchedOsm) {
    return Boolean(matchedOsm.direct)
  }

  // 2. Si no coincide con OSM pero hay un criterio de cocina/subcategoría específico (ej: Asiática, Parrilla, etc.)
  if (criteria && criteria.cuisines && criteria.cuisines.size > 0) {
    const normName = normalizeName(place.name)
    const cuisineKeywords = Array.from(criteria.cuisines)

    const matchesType = placeTypes.some((t) => {
      const lower = t.toLowerCase()
      return cuisineKeywords.some((c) => lower.includes(c))
    })

    const matchesName = cuisineKeywords.some((c) => c.length >= 3 && normName.includes(c))

    // Palabras del nombre que delatan la cocina: las mismas que usa el mapa
    return Boolean(matchesType || matchesName || nameMatchesCuisine(place.name, criteria.cuisines))
  }

  // 3. Fallback: sin criterio de cocina (ej. cafetería, gimnasio sin filtro, o "Otra")
  return (
    place.primaryType === terms.primary ||
    (Array.isArray(place.types) && place.types.includes(terms.primary))
  )
}

/**
 * Obtiene los términos de búsqueda asociados a la subcategoría desde la DB o fallback.
 */
async function resolveSubcategoryTerms(subcategoryCode) {
  const normalized = (subcategoryCode || 'restaurante').toLowerCase().trim()

  try {
    const sub = await Subcategory.findOne({
      where: { code: normalized },
      include: [{ model: SubcategorySearchTerm, as: 'searchTerms' }],
    })

    if (sub && sub.searchTerms && sub.searchTerms.length > 0) {
      const primaryTerm = sub.searchTerms.find((t) => t.isPrimary)?.termValue || 'restaurant'
      const indirectTerms =
        FALLBACK_CATEGORY_TERMS[normalized]?.indirect ||
        sub.searchTerms.filter((t) => !t.isPrimary).map((t) => t.termValue)

      return {
        name: sub.name,
        primary: primaryTerm,
        indirect: indirectTerms.length > 0 ? indirectTerms : ['food'],
      }
    }
  } catch (error) {
    console.warn(`[ProfitZone] No se pudo leer subcategoría de la DB (${error.message}). Usando configuración estática.`)
  }

  return (
    FALLBACK_CATEGORY_TERMS[normalized] || {
      name: normalized,
      primary: 'restaurant',
      indirect: ['bar', 'cafe'],
    }
  )
}

function generateCallout(directCount, averageRating) {
  if (directCount >= 5 && averageRating >= 4.4) {
    return 'Hay bastante competencia directa y bien valorada cerca del punto.'
  }
  if (directCount >= 5) {
    return 'Hay competencia directa consolidada con oportunidades de diferenciación por servicio y calidad.'
  }
  if (directCount > 0) {
    return 'Competencia directa moderada en el radio inmediato.'
  }
  return 'Zona con baja competencia directa identificada dentro del radio.'
}

// Reseñas "de base" del rating ajustado: con menos reseñas que esto, el rating propio pesa
// menos que el promedio de la zona (un 4,9 con 8 reseñas no le gana a un 4,5 con 12.000)
const RATING_PRIOR_REVIEWS = 50
// Tope de directos que se suman desde OpenStreetMap a la tabla (radios grandes tienen cientos)
const MAX_OSM_DIRECT_ROWS = 30

/**
 * Fuerza de un competidor para ordenar la tabla: rating ajustado por cantidad de reseñas
 * (promedio bayesiano contra el rating medio de la zona). Sin rating (locales que solo
 * están en OpenStreetMap): null, van después de los que tienen datos.
 */
function strengthScore(place, zoneAverage) {
  if (typeof place.rating !== 'number') return null
  const reviews = place.userRatingCount || 0
  const weight = reviews / (reviews + RATING_PRIOR_REVIEWS)
  return Number((weight * place.rating + (1 - weight) * zoneAverage).toFixed(3))
}

// Orden por defecto de la tabla: directos primero, después los más fuertes y, a igual
// fuerza (o sin datos), los más cercanos
function byStrength(a, b) {
  if ((a.type === 'Directa') !== (b.type === 'Directa')) return a.type === 'Directa' ? -1 : 1
  if (a.strength !== b.strength) {
    if (a.strength === null) return 1
    if (b.strength === null) return -1
    return b.strength - a.strength
  }
  return a.distanceMeters - b.distanceMeters
}

/**
 * Obtiene el análisis de competencia para un punto y radio dado.
 * - Tabla (`places`): una sola consulta a Google Places. Con cocina elegida (`match`, ej.
 *   "Asiática") pide los tipos de esa cocina, así la tabla muestra los competidores directos
 *   con rating; sin cocina, los tipos generales del rubro. Google devuelve hasta 20, los más
 *   populares. Los directos que OpenStreetMap ubica en el radio y Google no trajo se suman sin
 *   rating (`source: 'osm'`), para que la tabla y el conteo de directos coincidan.
 * - Conteo (`total`, `directCount`, `indirectCount`): los locales de OpenStreetMap en el radio
 *   más los de Google que OSM no tiene (o no reconoce como directos). Sin datos de OSM, el de
 *   los resultados de Google.
 */
export async function getCompetitionAnalysis({
  lat,
  lng,
  radiusInMeters = 1000,
  categoryCode,
  subcategory = 'restaurante',
  match,
}) {
  const normalizedSubcategory = subcategory.toLowerCase().trim()
  const resolvedCategory =
    categoryCode || (['gimnasio', 'pilates'].includes(normalizedSubcategory) ? 'fitness' : 'gastronomia')

  const terms = await resolveSubcategoryTerms(normalizedSubcategory)
  // El criterio de cocina se resuelve antes: define qué tipos se le piden a Google
  const criteria = await directCriteria(resolvedCategory, normalizedSubcategory, match).catch(() => null)
  const byCuisine = Boolean(criteria?.googleTypes?.length)
  const includedTypes = byCuisine ? criteria.googleTypes : [terms.primary, ...terms.indirect.slice(0, 3)]

  // Consulta en paralelo los locales de Google Places y los datos de OpenStreetMap
  const [rawPlaces, osmResult] = await Promise.all([
    searchNearbyPlaces({
      lat,
      lng,
      radiusInMeters,
      includedTypes,
      maxResultCount: 20,
    }),
    findNearbyPlaces({
      lat,
      lng,
      radius: radiusInMeters,
      categoryCode: resolvedCategory,
      subcategoryCode: normalizedSubcategory,
      match,
    }).catch((error) => {
      console.warn(`[ProfitZone] No se pudo leer datos de OSM para competencia: ${error.message}`)
      return null
    }),
  ])

  const rated = rawPlaces.filter((p) => typeof p.rating === 'number')
  const averageRating =
    rated.length > 0 ? Number((rated.reduce((sum, p) => sum + p.rating, 0) / rated.length).toFixed(1)) : null
  // Rating medio contra el que se ajustan los ratings con pocas reseñas
  const zoneAverage = averageRating ?? 4.3

  const matchedOsmIds = new Set()
  // Locales de Google que suman al conteo de OSM: los que OSM no tiene y los directos que OSM
  // no reconoce como directos (Google los tipifica con la cocina y OSM no tiene su etiqueta)
  let googleOnlyCount = 0
  let googleOnlyDirectCount = 0
  const googleRows = rawPlaces.map((p) => {
    const distanceMeters = calculateDistanceMeters(lat, lng, p.location.lat, p.location.lng)
    const matchedOsm = findMatchingOsmPlace(p, osmResult?.places)
    if (matchedOsm) matchedOsmIds.add(matchedOsm.id)
    else googleOnlyCount++
    const isDirect = isPlaceDirect({ place: p, matchedOsm, criteria, terms })
    if (isDirect && !matchedOsm?.direct) googleOnlyDirectCount++

    return {
      id: p.id,
      name: p.name,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      distanceMeters,
      distanceText: formatDistance(distanceMeters),
      type: isDirect ? 'Directa' : 'Indirecta',
      location: p.location,
      source: 'google',
      strength: strengthScore(p, zoneAverage),
    }
  })

  // Directos de OSM que Google no trajo (solo con cocina elegida): sin rating, pero en la tabla
  const osmRows = byCuisine
    ? (osmResult?.places ?? [])
        .filter((place) => place.direct && place.name && !matchedOsmIds.has(place.id))
        .map((place) => {
          const distanceMeters = calculateDistanceMeters(lat, lng, place.lat, place.lng)
          return {
            id: `osm-${place.id}`,
            name: place.name,
            rating: null,
            userRatingCount: null,
            distanceMeters,
            distanceText: formatDistance(distanceMeters),
            type: 'Directa',
            location: { lat: place.lat, lng: place.lng },
            source: 'osm',
            strength: null,
          }
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters)
        .slice(0, MAX_OSM_DIRECT_ROWS)
    : []

  const places = [...googleRows, ...osmRows].sort(byStrength)

  const hasOsmData = osmResult && typeof osmResult.total === 'number' && osmResult.total > 0
  // Con OSM: todos sus locales del radio más los que solo trajo Google, así el conteo nunca
  // queda por debajo de lo que muestra la tabla
  const total = hasOsmData ? osmResult.total + googleOnlyCount : places.length
  const directCount = hasOsmData
    ? osmResult.directTotal + googleOnlyDirectCount
    : places.filter((p) => p.type === 'Directa').length
  const indirectCount = Math.max(0, total - directCount)

  const callout = generateCallout(directCount, averageRating)

  return {
    total,
    directCount,
    indirectCount,
    averageRating,
    subcategory: normalizedSubcategory,
    subcategoryName: terms.name,
    // 'cuisine': la tabla trae los locales de la cocina elegida; 'general': los del rubro
    listMode: byCuisine ? 'cuisine' : 'general',
    cuisineLabel: criteria?.label ?? null,
    callout,
    source: 'Google Places',
    queryDate: new Date().toISOString(),
    isExact: Boolean(hasOsmData),
    places,
  }
}
