import { useState } from 'react'
import { createAnalysis, saveAnalysisLocation } from '../services/analyses.service.js'
import { useAnalysisFlow } from './useAnalysisFlow.js'
import { useAuth } from './useAuth.js'

// Guarda la ubicación y cobra el análisis según su nivel. Crea el análisis con las respuestas
// si todavía no existe en la API (el usuario llegó sin sesión y recién ahora tiene cuenta) o si ya
// no es accesible (404: se borró o quedó a nombre de otra cuenta, por ejemplo tras cambiar de usuario).
async function saveOrCreate({ analysisId, location, categoryCode, subcategoryCode, answers, tier }) {
  if (analysisId) {
    try {
      await saveAnalysisLocation(analysisId, location, tier)
      return analysisId
    } catch (error) {
      if (error.response?.status !== 404) throw error
    }
  }
  const analysis = await createAnalysis({ categoryCode, subcategoryCode, answers })
  await saveAnalysisLocation(analysis.id, location, tier)
  return analysis.id
}

/**
 * Guarda en la API el punto y el radio del análisis en curso ("Analizar zona") y gasta el crédito
 * del nivel elegido. Requiere sesión. `save(questionCodes, tier)` manda solo las respuestas de esas
 * preguntas si tiene que crear el análisis, y devuelve el id guardado (o null).
 * Con `status: 'error'`, `code` distingue el caso (ej. INSUFFICIENT_CREDITS).
 */
export function useSaveLocation() {
  const { analysisId, categoryCode, subcategoryCode, answers, location, setAnalysisId } =
    useAnalysisFlow()
  const { refreshUser } = useAuth()
  const [state, setState] = useState({ status: 'idle', error: null, code: null })

  const save = async (questionCodes, tier = 'basic') => {
    setState({ status: 'saving', error: null, code: null })
    // En sessionStorage pueden quedar respuestas de preguntas que ya no están activas
    const currentAnswers = Object.fromEntries(
      Object.entries(answers).filter(([code]) => questionCodes.includes(code)),
    )
    try {
      const savedId = await saveOrCreate({
        analysisId,
        location,
        categoryCode,
        subcategoryCode,
        answers: currentAnswers,
        tier,
      })
      if (savedId !== analysisId) setAnalysisId(savedId)
      // El saldo cambió: se refleja en la barra (si falla, se actualiza en la próxima carga)
      refreshUser().catch(() => {})
      setState({ status: 'idle', error: null, code: null })
      return savedId
    } catch (error) {
      setState({
        status: 'error',
        error: error.response?.data?.message ?? error.message,
        code: error.response?.data?.code ?? null,
      })
      return null
    }
  }

  return { ...state, save }
}
