// Pasos del flujo de análisis que muestra el Stepper en cada página de /analizar.
// `path: null` = el paso todavía no tiene vista. `isComplete` recibe el estado del
// AnalysisFlowContext y dice si el paso quedó listo para avanzar.
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
  { id: 'ubicacion', label: 'Ubicación', path: null, isComplete: () => false },
  { id: 'analisis', label: 'Análisis', path: null, isComplete: () => false },
  { id: 'reporte', label: 'Reporte', path: null, isComplete: () => false },
]
