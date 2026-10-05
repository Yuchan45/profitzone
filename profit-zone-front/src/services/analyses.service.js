import api from './api.js'

/** Crea el análisis en borrador con el rubro y las respuestas del paso "Tu negocio". */
export async function createAnalysis({ categoryCode, subcategoryCode, answers }) {
  const { data } = await api.post('/analyses', { categoryCode, subcategoryCode, answers })
  return data
}

/** Reemplaza las respuestas de un análisis ya creado. */
export async function replaceAnalysisAnswers(analysisId, answers) {
  const { data } = await api.put(`/analyses/${analysisId}/answers`, { answers })
  return data
}

/** Reporte de zona de un análisis con ubicación: resumen, criterios e indicadores. */
export async function fetchAnalysisReport(analysisId) {
  const { data } = await api.get(`/analyses/${analysisId}/report`)
  return data
}
