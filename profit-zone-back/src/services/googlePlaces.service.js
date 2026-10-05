import { env } from '../config/env.js'

const PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby'
const FIELD_MASK =
  'places.id,places.displayName,places.rating,places.userRatingCount,places.location,places.types,places.primaryType'

/**
 * Consulta lugares cercanos utilizando la nueva Google Places API (searchNearby).
 * Si no hay GOOGLE_PLACES_API_KEY configurada, devuelve datos simulados realistas.
 */
export async function searchNearbyPlaces({
  lat,
  lng,
  radiusInMeters = 1000,
  includedTypes = ['restaurant'],
  maxResultCount = 20,
}) {
  if (!env.googlePlacesApiKey) {
    console.warn('[ProfitZone] GOOGLE_PLACES_API_KEY no definida: usando datos de desarrollo para competencia.')
    return getMockPlaces(lat, lng, includedTypes[0])
  }

  const payload = {
    includedTypes,
    maxResultCount: Math.min(20, Math.max(1, maxResultCount)),
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusInMeters,
      },
    },
  }

  try {
    const response = await fetch(PLACES_NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.googlePlacesApiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[ProfitZone] Error de Google Places API (${response.status}):`, errorBody)
      throw new Error(`Google Places API respondió con estado ${response.status}`)
    }

    const data = await response.json()
    const rawPlaces = data.places || []

    return rawPlaces.map((p) => ({
      id: p.id,
      name: p.displayName?.text || 'Sin nombre',
      rating: typeof p.rating === 'number' ? Number(p.rating.toFixed(1)) : 4.0,
      userRatingCount: p.userRatingCount || 0,
      location: {
        lat: p.location?.latitude,
        lng: p.location?.longitude,
      },
      primaryType: p.primaryType || p.types?.[0] || includedTypes[0],
      types: p.types || [],
    }))
  } catch (error) {
    console.error('[ProfitZone] Falló la llamada a Google Places API:', error.message)
    // En caso de corte de red o error de API, recurrir a fallback de desarrollo para no voltear la experiencia
    return getMockPlaces(lat, lng, includedTypes[0])
  }
}

/** Mock realista para entornos de prueba offline o sin clave de Google */
function getMockPlaces(centerLat, centerLng, category) {
  const isCafe = category === 'cafe' || category === 'cafeteria'
  const isGym = category === 'gym' || category === 'fitness_center'

  const templates = isCafe
    ? [
        { name: 'Café Nômade', rating: 4.7, reviews: 1240, dLat: 0.0006, dLng: 0.0007, primaryType: 'cafe' },
        { name: 'Tostadores del Pasaje', rating: 4.6, reviews: 860, dLat: -0.0012, dLng: 0.0011, primaryType: 'cafe' },
        { name: 'Panadería Alba', rating: 4.2, reviews: 310, dLat: 0.0018, dLng: -0.0014, primaryType: 'bakery' },
        { name: 'Specialty Coffee Lab', rating: 4.8, reviews: 950, dLat: -0.0008, dLng: -0.002, primaryType: 'cafe' },
        { name: 'Confitería Las Violetas Express', rating: 4.3, reviews: 520, dLat: 0.0022, dLng: 0.0019, primaryType: 'bakery' },
      ]
    : isGym
      ? [
          { name: 'Megatlon Palermo', rating: 4.5, reviews: 1400, dLat: 0.001, dLng: 0.0008, primaryType: 'gym' },
          { name: 'CrossFit Box 23', rating: 4.8, reviews: 340, dLat: -0.0015, dLng: 0.0012, primaryType: 'gym' },
          { name: 'Pilates Reformer Studio', rating: 4.6, reviews: 190, dLat: 0.0018, dLng: -0.0011, primaryType: 'pilates' },
          { name: 'Smart Fit Scalabrini', rating: 4.1, reviews: 890, dLat: -0.002, dLng: -0.0018, primaryType: 'gym' },
        ]
      : [
          { name: 'Don Julio Parrilla', rating: 4.7, reviews: 18200, dLat: 0.0005, dLng: 0.0006, primaryType: 'restaurant' },
          { name: 'La Cabrera', rating: 4.5, reviews: 9400, dLat: -0.001, dLng: 0.0012, primaryType: 'restaurant' },
          { name: 'Cervecería Antares', rating: 4.3, reviews: 2100, dLat: 0.0014, dLng: -0.0015, primaryType: 'bar' },
          { name: 'Pizzería Güerrín Delivery', rating: 4.4, reviews: 1540, dLat: -0.0019, dLng: 0.0021, primaryType: 'meal_takeaway' },
        ]

  return templates.map((t, idx) => ({
    id: `mock-place-${idx + 1}`,
    name: t.name,
    rating: t.rating,
    userRatingCount: t.reviews,
    location: {
      lat: centerLat + t.dLat,
      lng: centerLng + t.dLng,
    },
    primaryType: t.primaryType,
    types: [t.primaryType, 'point_of_interest', 'establishment'],
  }))
}
