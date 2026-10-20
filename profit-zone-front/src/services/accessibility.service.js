import api from './api.js'

/**
 * Consulta la accesibilidad y transporte público en el radio de una ubicación.
 * Consume la API de Google Places (/api/accessibility).
 */
export async function getAccessibility({ lat, lng, radius }) {
  const { data } = await api.get('/accessibility', {
    params: { lat, lng, radius },
  })
  return data
}

