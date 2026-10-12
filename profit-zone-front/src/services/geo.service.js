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
