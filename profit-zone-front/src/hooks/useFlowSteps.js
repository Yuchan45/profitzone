import { useAnalysisFlow } from './useAnalysisFlow.js'
import { FLOW_STEPS } from '../utils/flowSteps.js'

/**
 * Pasos del flujo listos para el Stepper: { label, to }.
 * `to` solo viene cuando se puede navegar al paso: tiene vista y todos los
 * anteriores están completos. Los pasos previos siempre quedan habilitados.
 */
export function useFlowSteps() {
  const flow = useAnalysisFlow()

  return FLOW_STEPS.map((step, index) => {
    const previousComplete = FLOW_STEPS.slice(0, index).every((s) => s.isComplete(flow))
    return {
      label: step.label,
      to: step.path && previousComplete ? step.path : null,
    }
  })
}
