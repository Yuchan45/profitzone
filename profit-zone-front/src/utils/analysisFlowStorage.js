// Estado del flujo de análisis en sessionStorage: sobrevive a un refresh y se borra al
// cerrar la pestaña. Lo usa el AnalysisFlowProvider y, fuera del flujo, "Continuar" un
// borrador desde Mis reportes (el provider lo lee al montarse en /analizar).
const STORAGE_KEY = 'profitzone_analysis_flow_v1'

export const INITIAL_FLOW_STATE = {
  // id del análisis guardado en la API (se crea al terminar "Tu negocio")
  analysisId: null,
  categoryCode: null,
  subcategoryCode: null,
  // { [questionCode]: string[] } con los codes de las opciones elegidas
  answers: {},
  // Punto y radio del paso 3: { lat, lng, radius }
  location: null,
  // { [stepId]: string[] } codes de las preguntas obligatorias de cada paso con encuesta.
  // Lo registra cada paso al cargar sus preguntas y sirve para saber si está completo.
  requiredQuestions: {},
  // id del análisis cuyo reporte se generó bien (paso 4). Cualquier cambio en el rubro,
  // las respuestas o la ubicación lo invalida: hay que volver a "Analizar zona".
  reportReadyFor: null,
}

export function readFlowState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? { ...INITIAL_FLOW_STATE, ...JSON.parse(raw) } : INITIAL_FLOW_STATE
  } catch {
    return INITIAL_FLOW_STATE
  }
}

export function writeFlowState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignorar error de cuota o sessionStorage bloqueado
  }
}

/**
 * Estado del flujo para retomar un borrador de la API (GET /analyses/:id). Un borrador
 * siempre tiene sus respuestas obligatorias (se validaron al guardarlo): se registran
 * como las del paso "Tu negocio" para que el paso cuente como completo sin volver a él.
 */
export function flowStateFromAnalysis(analysis) {
  return {
    ...INITIAL_FLOW_STATE,
    analysisId: analysis.id,
    categoryCode: analysis.category.code,
    subcategoryCode: analysis.subcategory.code,
    answers: analysis.answers,
    location: analysis.location,
    requiredQuestions: { negocio: Object.keys(analysis.answers) },
  }
}
