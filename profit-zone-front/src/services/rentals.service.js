import api from './api.js'

/**
 * Locales comerciales en alquiler dentro del círculo (avisos de ZonaProp en nuestra base).
 * Devuelve el resumen de precios y `places`: [{ id, address, priceArs, surfaceM2, lat, lng,
 * locationPrecision, distanceText, url, … }].
 */
export async function fetchRentals({ lat, lng, radius }) {
  const { data } = await api.get('/rentals', { params: { lat, lng, radius } })
  return data
}
