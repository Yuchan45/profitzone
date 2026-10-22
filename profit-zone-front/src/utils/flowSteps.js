// Pasos del flujo de análisis que muestra el Stepper en cada página de /analizar.
// `path` es la vista del paso: un string, o una función que recibe el estado del
// AnalysisFlowContext y devuelve null mientras no se puede entrar. `isComplete` recibe
// ese mismo estado y dice si el paso quedó listo para avanzar.

// El análisis (paso 4) se arma con el pedido a la API: se puede
// volver a él una vez que salió bien, hasta que cambie algo de lo que respondió el usuario.
export const isReportReady = (flow) => Boolean(flow.analysisId) && flow.reportReadyFor === flow.analysisId
const readyPath = (prefix) => (flow) => (isReportReady(flow) ? `${prefix}/${flow.analysisId}` : null)

export const FLOW_STEPS = [
  {
    id: 'rubro',
    label: 'Rubro',
    path: '/analizar/rubro',
    isComplete: (flow) => Boolean(flow.categoryCode && flow.subcategoryCode),
  },
  {
    id: 'negocio',
    label: 'Tu negocio',
    path: '/analizar/negocio',
    isComplete: (flow) => {
      const required = flow.requiredQuestions.negocio
      // Si nunca se cargaron sus preguntas, el paso no se completó
      return Boolean(required) && required.every((code) => flow.answers[code]?.length > 0)
    },
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    path: '/analizar/ubicacion',
    isComplete: (flow) => Boolean(flow.analysisId && flow.location),
  },
  { id: 'analisis', label: 'Análisis', path: readyPath('/analizar/analisis'), isComplete: isReportReady },
]

// Destino de "Analizar una zona" y "Nuevo análisis": el AnalysisFlowProvider lee el flag
// y, si el análisis guardado ya terminó, arranca uno nuevo
export const NEW_ANALYSIS_LINK = { to: FLOW_STEPS[0].path, state: { newAnalysis: true } }
