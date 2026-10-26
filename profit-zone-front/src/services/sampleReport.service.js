import api from './api.js'

/**
 * Reporte de ejemplo de la home: misma forma que el reporte de un análisis, más
 * `business` ({ categoryCode, subcategoryCode, answers }). Público.
 */
export async function fetchSampleReport() {
  const { data } = await api.get('/sample-report')
  return data
}
