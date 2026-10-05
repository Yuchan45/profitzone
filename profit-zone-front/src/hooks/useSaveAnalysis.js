import { useState } from 'react'
import { createAnalysis, replaceAnalysisAnswers } from '../services/analyses.service.js'
import { useAnalysisFlow } from './useAnalysisFlow.js'

// Reemplaza las respuestas de un análisis ya guardado. Devuelve false si el análisis
// ya no existe en la API (404), para que se cree uno nuevo en su lugar.
async function replaceAnswersIfExists(analysisId, answers) {
  try {
    await replaceAnalysisAnswers(analysisId, answers)
    return true
  } catch (error) {
    if (error.response?.status === 404) return false
    throw error
  }
}

/**
 * Guarda en la API el análisis en curso del flujo: lo crea la primera vez y, si
 * ya existe, reemplaza sus respuestas. `save(questionCodes)` manda solo las
 * respuestas de esas preguntas (las de la encuesta actual) y devuelve true si se guardó.
 */
export function useSaveAnalysis() {
  const { analysisId, categoryCode, subcategoryCode, answers, setAnalysisId } = useAnalysisFlow()
  const [state, setState] = useState({ status: 'idle', error: null })

  const save = async (questionCodes) => {
    setState({ status: 'saving', error: null })
    // En sessionStorage pueden quedar respuestas de preguntas que ya no están activas
    const currentAnswers = Object.fromEntries(
      Object.entries(answers).filter(([code]) => questionCodes.includes(code)),
    )
    try {
      const replaced = analysisId && (await replaceAnswersIfExists(analysisId, currentAnswers))
      if (!replaced) {
        const analysis = await createAnalysis({
          categoryCode,
          subcategoryCode,
          answers: currentAnswers,
        })
        setAnalysisId(analysis.id)
      }
      setState({ status: 'idle', error: null })
      return true
    } catch (error) {
      setState({ status: 'error', error: error.response?.data?.message ?? error.message })
      return false
    }
  }

  return { ...state, save }
}
