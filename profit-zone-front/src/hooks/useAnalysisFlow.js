import { useContext } from 'react'
import { AnalysisFlowContext } from '../context/analysisFlowContextValue.js'

export function useAnalysisFlow() {
  const context = useContext(AnalysisFlowContext)
  if (!context) {
    throw new Error('useAnalysisFlow debe usarse dentro de un AnalysisFlowProvider')
  }
  return context
}
