import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnalysisFlowContext } from './analysisFlowContextValue.js'
import { isReportReady } from '../utils/flowSteps.js'
import {
  INITIAL_FLOW_STATE as INITIAL_STATE,
  readFlowState,
  writeFlowState,
} from '../utils/analysisFlowStorage.js'

/** Estado compartido entre los pasos del flujo de análisis (rubro → negocio → …). */
export function AnalysisFlowProvider({ children }) {
  const [state, setState] = useState(readFlowState)
  const location = useLocation()
  const navigate = useNavigate()
  const startsNewAnalysis = Boolean(location.state?.newAnalysis)
  const [handledLocationKey, setHandledLocationKey] = useState(null)

  // Los links de NEW_ANALYSIS_LINK ("Analizar una zona", "Nuevo análisis") retoman un análisis
  // a medio hacer, pero si el guardado ya tiene su reporte, terminó: se arranca uno nuevo.
  // Se resuelve en el render de la ruta nueva: el reporte ya no está montado y no vuelve a pedirse.
  if (startsNewAnalysis && handledLocationKey !== location.key) {
    setHandledLocationKey(location.key)
    if (isReportReady(state)) setState(INITIAL_STATE)
  }

  // Se saca el flag del historial para que un refresh no vuelva a aplicarlo
  useEffect(() => {
    if (!startsNewAnalysis) return
    const { pathname, search, hash } = location
    navigate({ pathname, search, hash }, { replace: true, state: null })
  }, [startsNewAnalysis, location, navigate])

  useEffect(() => {
    writeFlowState(state)
  }, [state])

  const value = useMemo(
    () => ({
      ...state,
      // Cierra el análisis en curso justo antes de navegar fuera del flujo (al guardar el
      // reporte o al salir). Solo vacía sessionStorage: al salir el provider se desmonta y,
      // al volver, arranca de cero. No toca el estado para que el paso actual no reaccione
      // (ej. Ubicación redirige a "Tu negocio" si se vacían las respuestas) antes de salir.
      closeFlow: () => writeFlowState(INITIAL_STATE),
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
