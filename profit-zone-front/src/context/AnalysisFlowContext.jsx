import { useEffect, useMemo, useState } from 'react'
import { AnalysisFlowContext } from './analysisFlowContextValue.js'

// Se guarda en sessionStorage: sobrevive a un refresh y se borra al cerrar la pestaña.
const STORAGE_KEY = 'profitzone_analysis_flow_v1'

const INITIAL_STATE = {
  categoryCode: null,
  subcategoryCode: null,
  // { [questionCode]: string[] } con los codes de las opciones elegidas
  answers: {},
  // { [stepId]: string[] } codes de las preguntas obligatorias de cada paso con encuesta.
  // Lo registra cada paso al cargar sus preguntas y sirve para saber si está completo.
  requiredQuestions: {},
}

function readStoredState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? { ...INITIAL_STATE, ...JSON.parse(raw) } : INITIAL_STATE
  } catch {
    return INITIAL_STATE
  }
}

/** Estado compartido entre los pasos del flujo de análisis (rubro → negocio → …). */
export function AnalysisFlowProvider({ children }) {
  const [state, setState] = useState(readStoredState)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignorar error de cuota o sessionStorage bloqueado
    }
  }, [state])

  const value = useMemo(
    () => ({
      ...state,
      setRubro: (categoryCode, subcategoryCode) => {
        setState((prev) => {
          // Las respuestas dependen del rubro: si cambia, se empieza de cero
          const sameRubro = prev.subcategoryCode === subcategoryCode
          return {
            categoryCode,
            subcategoryCode,
            answers: sameRubro ? prev.answers : {},
            requiredQuestions: sameRubro ? prev.requiredQuestions : {},
          }
        })
      },
      setAnswer: (questionCode, optionCodes) => {
        setState((prev) => ({
          ...prev,
          answers: { ...prev.answers, [questionCode]: optionCodes },
        }))
      },
      setRequiredQuestions: (stepId, questionCodes) => {
        setState((prev) => {
          // Evita un render de más si no cambió
          if (prev.requiredQuestions[stepId]?.join() === questionCodes.join()) return prev
          return {
            ...prev,
            requiredQuestions: { ...prev.requiredQuestions, [stepId]: questionCodes },
          }
        })
      },
    }),
    [state],
  )

  return <AnalysisFlowContext.Provider value={value}>{children}</AnalysisFlowContext.Provider>
}
