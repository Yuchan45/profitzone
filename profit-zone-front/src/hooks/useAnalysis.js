import { useContext } from 'react'
import { AnalysisContext } from '../context/analysisContextValue.js'

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error('useAnalysis debe usarse dentro de un AnalysisProvider')
  }
  return context
}
