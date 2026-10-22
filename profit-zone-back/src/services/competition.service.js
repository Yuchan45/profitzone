import { searchNearbyPlaces } from './googlePlaces.service.js'
import { Subcategory, SubcategorySearchTerm } from '../models/index.js'
import { calculateDistanceMeters, formatDistance } from '../utils/geo.js'
import { findNearbyPlaces, directCriteria } from './places.service.js'

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
 * Normaliza nombres para comparación insensible a mayúsculas, tildes y signos.
 */
function normalizeName(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
  // 1. Si coincide con un local de OSM, la categorización de OSM es la fuente de verdad
  if (matchedOsm) {
    return Boolean(matchedOsm.direct)
  }

  // 2. Si no coincide con OSM pero hay un criterio de cocina/subcategoría específico (ej: Asiática, Parrilla, etc.)
  if (criteria && criteria.cuisines && criteria.cuisines.size > 0) {
    const placeTypes = [place.primaryType, ...(place.types || [])].filter(Boolean)
    const normName = normalizeName(place.name)
    const cuisineKeywords = Array.from(criteria.cuisines)

    const matchesType = placeTypes.some((t) => {
      const lower = t.toLowerCase()
      return cuisineKeywords.some((c) => lower.includes(c))
    })

    const matchesName = cuisineKeywords.some((c) => c.length >= 3 && normName.includes(c))

    let matchesExtra = false
    if (criteria.cuisines.has('asian')) {
      matchesExtra = /(sushi|nikkei|ramen|wok|asian|asiatic|japon|japones|chin[ao]|corean|thai|vietnam|poke)/i.test(normName)
    } else if (criteria.cuisines.has('grill') || criteria.cuisines.has('steak_house')) {
      matchesExtra = /(parrill|asador|steak|carnes?|grill|bife|costillar)/i.test(normName)
    } else if (criteria.cuisines.has('italian') || criteria.cuisines.has('pizza')) {
      matchesExtra = /(pizz|pastas?|italian|trattoria|pizzeria)/i.test(normName)
    } else if (criteria.cuisines.has('international')) {
      matchesExtra = /(autor|fusion|internacional|bistro|gourmet)/i.test(normName)
    }

    return Boolean(matchesType || matchesName || matchesExtra)
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

/**
 * Obtiene el análisis de competencia para un punto y radio dado,
 * utilizando la categorización de OpenStreetMap para clasificar los locales
 * en competencia directa o indirecta.
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
  const includedTypes = [terms.primary, ...terms.indirect.slice(0, 3)]

  // Consulta en paralelo los locales de Google Places y los datos de OpenStreetMap
  const [rawPlaces, osmResult, criteria] = await Promise.all([
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
    directCriteria(resolvedCategory, normalizedSubcategory, match).catch(() => null),
  ])

  let totalRatingSum = 0
  let ratedCount = 0

  const places = rawPlaces.map((p) => {
    const distanceMeters = calculateDistanceMeters(lat, lng, p.location.lat, p.location.lng)
    const matchedOsm = findMatchingOsmPlace(p, osmResult?.places)
    const isDirect = isPlaceDirect({ place: p, matchedOsm, criteria, terms })

    if (p.rating) {
      totalRatingSum += p.rating
      ratedCount++
    }

    return {
      id: p.id,
      name: p.name,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      distanceMeters,
      distanceText: formatDistance(distanceMeters),
      type: isDirect ? 'Directa' : 'Indirecta',
      location: p.location,
    }
  })

  // Ordenar por distancia (los más cercanos primero, como en la tabla de la imagen)
  places.sort((a, b) => a.distanceMeters - b.distanceMeters)

  const hasOsmData = osmResult && typeof osmResult.total === 'number' && osmResult.total > 0
  const total = hasOsmData ? osmResult.total : places.length
  const directCount = hasOsmData
    ? osmResult.directTotal
    : places.filter((p) => p.type === 'Directa').length
  const indirectCount = hasOsmData ? Math.max(0, total - directCount) : total - directCount

  const averageRating = ratedCount > 0 ? Number((totalRatingSum / ratedCount).toFixed(1)) : 4.0
  const callout = generateCallout(directCount, averageRating)

  return {
    total,
    directCount,
    indirectCount,
    averageRating,
    subcategory: normalizedSubcategory,
    subcategoryName: terms.name,
    callout,
    source: 'Google Places',
    queryDate: new Date().toISOString(),
    isExact: Boolean(hasOsmData),
    places,
  }
}
