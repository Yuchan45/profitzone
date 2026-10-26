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

/**
 * Análisis del usuario con sesión, del más reciente al más viejo.
 * `status`: 'saved' (reportes guardados) o 'draft' (borradores).
 */
export async function fetchMyAnalyses(status) {
  const { data } = await api.get('/analyses', { params: { status } })
  return data
}

/** Un análisis con su rubro, ubicación y respuestas (para retomar un borrador). */
export async function fetchAnalysis(analysisId) {
  const { data } = await api.get(`/analyses/${analysisId}`)
  return data
}

/** Reporte de zona de un análisis con ubicación: resumen, criterios e indicadores. */
export async function fetchAnalysisReport(analysisId) {
  const { data } = await api.get(`/analyses/${analysisId}/report`)
  return data
}

/**
 * Guarda el punto y el radio del análisis ("Analizar zona"; requiere sesión: el análisis
 * queda a su nombre). Con la ubicación pasa a reporte guardado y aparece en Mis reportes.
 */
export async function saveAnalysisLocation(analysisId, { lat, lng, radius }) {
  const { data } = await api.patch(`/analyses/${analysisId}/location`, { lat, lng, radius })
  return data
}

/** Renombra un análisis. `name` vacío o null vuelve a mostrar el rubro. */
export async function renameAnalysis(analysisId, name) {
  const { data } = await api.patch(`/analyses/${analysisId}`, { name })
  return data
}

/** Elimina un análisis, borrador o reporte guardado. */
export async function deleteAnalysis(analysisId) {
  await api.delete(`/analyses/${analysisId}`)
}
