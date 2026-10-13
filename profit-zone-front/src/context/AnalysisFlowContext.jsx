import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnalysisFlowContext } from './analysisFlowContextValue.js'

// Se guarda en sessionStorage: sobrevive a un refresh y se borra al cerrar la pestaña.
const STORAGE_KEY = 'profitzone_analysis_flow_v1'

const INITIAL_STATE = {
  // id del análisis guardado en la API (se crea al terminar "Tu negocio")
  analysisId: null,
  categoryCode: null,
  subcategoryCode: null,
  // { [questionCode]: string[] } con los codes de las opciones elegidas
  answers: {},
  // Punto y radio del paso 3: { lat, lng, radius }
  location: null,
  // { [stepId]: string[] } codes de las preguntas obligatorias de cada paso con encuesta.
  // Lo registra cada paso al cargar sus preguntas y sirve para saber si está completo.
  requiredQuestions: {},
  // id del análisis cuyo reporte se generó bien (paso 4). Cualquier cambio en el rubro,
  // las respuestas o la ubicación lo invalida: hay que volver a "Analizar zona".
  reportReadyFor: null,
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
  const location = useLocation()
  const navigate = useNavigate()
  const startsNewAnalysis = Boolean(location.state?.newAnalysis)
  const [resetForKey, setResetForKey] = useState(null)

  // Los botones de "Analizar una zona" y "Nuevo análisis" navegan con { newAnalysis: true }:
  // se descarta lo guardado del análisis anterior. Se hace en el render para no mostrar los datos viejos.
  if (startsNewAnalysis && resetForKey !== location.key) {
    setResetForKey(location.key)
    setState(INITIAL_STATE)
  }

  // Se limpia el flag del historial para que un refresh no vuelva a resetear
  useEffect(() => {
    if (startsNewAnalysis) navigate(location.pathname, { replace: true, state: null })
  }, [startsNewAnalysis, location.pathname, navigate])

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
          // El code de subcategoría es único solo dentro de su categoría
          const sameRubro =
            prev.categoryCode === categoryCode && prev.subcategoryCode === subcategoryCode
          return {
            // Otro rubro es otro análisis: el guardado deja de aplicar
            analysisId: sameRubro ? prev.analysisId : null,
            categoryCode,
            subcategoryCode,
            answers: sameRubro ? prev.answers : {},
            requiredQuestions: sameRubro ? prev.requiredQuestions : {},
            reportReadyFor: sameRubro ? prev.reportReadyFor : null,
            // El punto no depende del rubro: se mantiene para no volver a marcarlo
            location: prev.location,
          }
        })
      },
      setAnswer: (questionCode, optionCodes) => {
        setState((prev) => ({
          ...prev,
          answers: { ...prev.answers, [questionCode]: optionCodes },
          reportReadyFor: null,
        }))
      },
      setLocation: (location) => {
        setState((prev) => ({ ...prev, location, reportReadyFor: null }))
      },
      setAnalysisId: (analysisId) => {
        setState((prev) => ({ ...prev, analysisId }))
      },
      setReportReady: (analysisId) => {
        setState((prev) => (prev.reportReadyFor === analysisId ? prev : { ...prev, reportReadyFor: analysisId }))
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
