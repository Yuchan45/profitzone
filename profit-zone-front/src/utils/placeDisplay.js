// Textos para la ficha de un negocio de la vista previa (datos de OpenStreetMap).

const KIND_LABELS = {
  restaurant: 'Restaurante',
  fast_food: 'Comida rápida',
  cafe: 'Café',
  fitness: 'Gimnasio',
  pilates: 'Estudio de pilates',
}

// Valores más comunes de la etiqueta cuisine de OSM en Palermo; el resto se muestra tal cual
const CUISINE_LABELS = {
  pizza: 'Pizza',
  italian: 'Italiana',
  pasta: 'Pastas',
  argentinian: 'Argentina',
  regional: 'Regional',
  steak_house: 'Parrilla',
  barbecue: 'Parrilla',
  grill: 'Parrilla',
  coffee_shop: 'Café',
  sushi: 'Sushi',
  japanese: 'Japonesa',
  chinese: 'China',
  asian: 'Asiática',
  korean: 'Coreana',
  thai: 'Tailandesa',
  vietnamese: 'Vietnamita',
  indian: 'India',
  ramen: 'Ramen',
  peruvian: 'Peruana',
  mexican: 'Mexicana',
  spanish: 'Española',
  french: 'Francesa',
  mediterranean: 'Mediterránea',
  international: 'Internacional',
  fusion: 'Fusión',
  american: 'Americana',
  burger: 'Hamburguesas',
  sandwich: 'Sándwiches',
  chicken: 'Pollo',
  empanada: 'Empanadas',
  breakfast: 'Desayunos',
  ice_cream: 'Helados',
  vegan: 'Vegana',
  vegetarian: 'Vegetariana',
}

const DAY_LABELS = { Mo: 'Lu', Tu: 'Ma', We: 'Mi', Th: 'Ju', Fr: 'Vi', Sa: 'Sá', Su: 'Do', PH: 'Feriados' }

export function placeKindLabel(kind) {
  return KIND_LABELS[kind] ?? 'Negocio'
}

export function cuisineLabels(cuisines) {
  return cuisines.map((value) => CUISINE_LABELS[value] ?? value.replaceAll('_', ' '))
}

/**
 * Horarios de OSM en español, una línea por regla:
 * "Mo-Th 07:30-23:00; Fr 07:30-02:30" → ["Lu-Ju 07:30-23:00", "Vi 07:30-02:30"].
 * Solo traduce: no calcula si está abierto (el formato de OSM tiene demasiadas variantes).
 */
export function formatOpeningHours(openingHours) {
  if (openingHours.trim() === '24/7') return ['Todos los días, las 24 horas']
  return openingHours
    .split(';')
    .map((rule) =>
      rule
        .trim()
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (day) => DAY_LABELS[day])
        .replace(/\boff\b/g, 'cerrado'),
    )
    .filter(Boolean)
}

/** Dirección "Malabia 1720", o null si no tiene calle. */
export function placeAddress(details) {
  if (!details.street) return null
  return details.houseNumber ? `${details.street} ${details.houseNumber}` : details.street
}

/** URL navegable: agrega https:// si falta, y null si no parece una URL. */
export function toExternalUrl(value) {
  if (!value) return null
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    return new URL(url).href
  } catch {
    return null
  }
}

/** Perfil de Instagram: acepta la URL completa o solo el usuario ("@cafe" o "cafe"). */
export function instagramUrl(value) {
  if (!value) return null
  if (/instagram\.com/i.test(value)) return toExternalUrl(value)
  return toExternalUrl(`instagram.com/${value.replace(/^@/, '')}`)
}

/** Texto visible de un link: sin protocolo, sin "www." y sin la barra final. */
export function displayUrl(url) {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
}

/**
 * Link a la búsqueda del local en Google Maps (gratis: se abre en el sitio de Google,
 * con sus fotos y reseñas). Busca por nombre y dirección; sin nombre, por coordenadas.
 */
export function googleMapsUrl(place) {
  const address = placeAddress(place.details)
  const query = place.name
    ? [place.name, address, 'Palermo, Buenos Aires'].filter(Boolean).join(', ')
    : `${place.lat},${place.lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/**
 * Link a la ficha de Google Maps de un local de Google Places (tabla de competencia).
 * Con `placeId` abre ese local exacto; el nombre queda como respaldo de la búsqueda.
 * Enlazar a Google Maps está permitido por sus términos (mostrar sus datos en nuestro mapa, no).
 */
export function googlePlaceUrl(name, placeId) {
  const query = encodeURIComponent(`${name}, Palermo, Buenos Aires`)
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`
  // Sin id de Google (locales que solo están en OpenStreetMap): búsqueda por nombre
  return placeId ? `${url}&query_place_id=${encodeURIComponent(placeId)}` : url
}

/** Servicios que el local tiene marcados como "yes" en OSM. */
export function placeAmenities(details) {
  const amenities = []
  if (details.outdoorSeating === 'yes') amenities.push('Mesas afuera')
  if (details.delivery === 'yes') amenities.push('Delivery')
  if (details.takeaway === 'yes') amenities.push('Take away')
  if (details.wheelchair === 'yes') amenities.push('Accesible')
  return amenities
}
