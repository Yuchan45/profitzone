import api from './api.js'

/** Barrios donde se puede analizar, con su contorno ([lat, lng]) y centro. */
export async function fetchNeighborhoods() {
  const { data } = await api.get('/neighborhoods')
  return data
}

/** Direcciones de CABA que coinciden con el texto: [{ label, lat, lng }]. */
export async function searchAddresses(query) {
  const { data } = await api.get('/geocode', { params: { q: query } })
  return data
}

/** Dirección más cercana a un punto del barrio: { label } (label null si no hay). */
export async function reverseGeocode({ lat, lng }) {
  const { data } = await api.get('/geocode/reverse', { params: { lat, lng } })
  return data
}

/**
 * Negocios del rubro dentro del círculo (vista previa, datos de OpenStreetMap):
 * { total, directTotal, directLabel, places: [{ id, name, lat, lng, direct }] }.
 */
export async function fetchNearbyPlaces({ lat, lng, radius, category, subcategory, match }) {
  const { data } = await api.get('/places/nearby', {
    params: { lat, lng, radius, category, subcategory, match: match ?? undefined },
  })
  return data
}

/** Ficha de un negocio de la vista previa (datos de OpenStreetMap). */
export async function fetchPlace(id) {
  const { data } = await api.get(`/places/${id}`)
  return data
}
