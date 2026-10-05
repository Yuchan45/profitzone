import { useState } from 'react'
import { saveAnalysisLocation } from '../services/analyses.service.js'
import { useAnalysisFlow } from './useAnalysisFlow.js'

/**
 * Guarda en la API el punto y el radio del análisis en curso ("Analizar zona").
 * `save()` devuelve true si se guardó. Requiere sesión iniciada.
 */
export function useSaveLocation() {
  const { analysisId, location } = useAnalysisFlow()
  const [state, setState] = useState({ status: 'idle', error: null })

  const save = async () => {
    setState({ status: 'saving', error: null })
    try {
      await saveAnalysisLocation(analysisId, location)
      setState({ status: 'idle', error: null })
      return true
    } catch (error) {
      setState({ status: 'error', error: error.response?.data?.message ?? error.message })
      return false
    }
  }

  return { ...state, save }
}
