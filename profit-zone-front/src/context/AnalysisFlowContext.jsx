import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnalysisFlowContext } from './analysisFlowContextValue.js'
import { FLOW_STEPS, isReportReady } from '../utils/flowSteps.js'

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

const FIRST_STEP_PATH = FLOW_STEPS[0].path

// Entrar al flujo por el paso 1 ("Analizar una zona") retoma un análisis a medio hacer,
// pero si el guardado ya tiene su reporte, ese análisis terminó: se arranca uno nuevo
function readStoredState(pathname) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const stored = raw ? { ...INITIAL_STATE, ...JSON.parse(raw) } : INITIAL_STATE
    return pathname === FIRST_STEP_PATH && isReportReady(stored) ? INITIAL_STATE : stored
  } catch {
    return INITIAL_STATE
  }
}

/** Estado compartido entre los pasos del flujo de análisis (rubro → negocio → …). */
export function AnalysisFlowProvider({ children }) {
  const { pathname } = useLocation()
  // Solo se lee al montar: es cuando se entra al flujo desde afuera (home, Navbar)
  const [state, setState] = useState(() => readStoredState(pathname))

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
      // "Nuevo análisis": descarta todo lo del análisis anterior
      reset: () => setState(INITIAL_STATE),
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
