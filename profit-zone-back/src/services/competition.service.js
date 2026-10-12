import { searchNearbyPlaces } from './googlePlaces.service.js'
import { Subcategory, SubcategorySearchTerm } from '../models/index.js'

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
 * Calcula la distancia geodésica en metros entre dos coordenadas (fórmula de Haversine).
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0
  const R = 6371000 // Radio de la Tierra en metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function formatDistance(meters) {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
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
 * Obtiene el análisis de competencia para un punto y radio dado.
 */
export async function getCompetitionAnalysis({ lat, lng, radiusInMeters = 1000, subcategory = 'restaurante' }) {
  const terms = await resolveSubcategoryTerms(subcategory)
  const includedTypes = [terms.primary, ...terms.indirect.slice(0, 3)]

  const rawPlaces = await searchNearbyPlaces({
    lat,
    lng,
    radiusInMeters,
    includedTypes,
    maxResultCount: 20,
  })

  let directCount = 0
  let indirectCount = 0
  let totalRatingSum = 0
  let ratedCount = 0

  const places = rawPlaces.map((p) => {
    const distanceMeters = calculateDistanceMeters(lat, lng, p.location.lat, p.location.lng)
    const isDirect =
      p.primaryType === terms.primary || (Array.isArray(p.types) && p.types.includes(terms.primary))

    if (isDirect) {
      directCount++
    } else {
      indirectCount++
    }

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

  const averageRating = ratedCount > 0 ? Number((totalRatingSum / ratedCount).toFixed(1)) : 4.0
  const callout = generateCallout(directCount, averageRating)

  return {
    total: places.length,
    directCount,
    indirectCount,
    averageRating,
    subcategory: subcategory.toLowerCase(),
    subcategoryName: terms.name,
    callout,
    source: 'Google Places',
    queryDate: new Date().toISOString(),
    places,
  }
}
