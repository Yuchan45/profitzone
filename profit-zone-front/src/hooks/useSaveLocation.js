import { useState } from 'react'
import { createAnalysis, saveAnalysisLocation } from '../services/analyses.service.js'
import { useAnalysisFlow } from './useAnalysisFlow.js'

// Guarda la ubicación; si el análisis ya no es accesible (404: se borró o quedó a
// nombre de otra cuenta, por ejemplo tras cambiar de usuario), crea uno nuevo
// con las mismas respuestas y la guarda ahí.
async function saveOrRecreate({ analysisId, location, categoryCode, subcategoryCode, answers }) {
  try {
    await saveAnalysisLocation(analysisId, location)
    return analysisId
  } catch (error) {
    if (error.response?.status !== 404) throw error
  }
  const analysis = await createAnalysis({ categoryCode, subcategoryCode, answers })
  await saveAnalysisLocation(analysis.id, location)
  return analysis.id
}

/**
 * Guarda en la API el punto y el radio del análisis en curso ("Analizar zona").
 * Requiere sesión. `save(questionCodes)` manda solo las respuestas de esas
 * preguntas si tiene que recrear el análisis, y devuelve el id guardado (o null).
 */
export function useSaveLocation() {
  const { analysisId, categoryCode, subcategoryCode, answers, location, setAnalysisId } =
    useAnalysisFlow()
  const [state, setState] = useState({ status: 'idle', error: null })

  const save = async (questionCodes) => {
    setState({ status: 'saving', error: null })
    // En sessionStorage pueden quedar respuestas de preguntas que ya no están activas
    const currentAnswers = Object.fromEntries(
      Object.entries(answers).filter(([code]) => questionCodes.includes(code)),
    )
    try {
      const savedId = await saveOrRecreate({
        analysisId,
        location,
        categoryCode,
        subcategoryCode,
        answers: currentAnswers,
      })
      if (savedId !== analysisId) setAnalysisId(savedId)
      setState({ status: 'idle', error: null })
      return savedId
    } catch (error) {
      setState({ status: 'error', error: error.response?.data?.message ?? error.message })
      return null
    }
  }

  return { ...state, save }
}
