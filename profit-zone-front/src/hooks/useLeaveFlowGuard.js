import { useEffect, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { createAnalysis, replaceAnalysisAnswers, saveAnalysisLocation } from '../services/analyses.service.js'
import { FLOW_STEPS, isReportReady } from '../utils/flowSteps.js'
import { useAnalysisFlow } from './useAnalysisFlow.js'
import { useAuth } from './useAuth.js'

const isFlowPath = (pathname) => pathname.startsWith('/analizar/')
// Ir a iniciar sesión o crear cuenta no abandona el flujo: después se vuelve a él
const AUTH_PATHS = ['/login', '/registro']
const negocioStep = FLOW_STEPS.find((step) => step.id === 'negocio')

// Errores de validación de la API: los datos sin guardar no son válidos (ej. un punto
// fuera del barrio). No frenan el guardado: el análisis queda con su última versión válida
const isValidationError = (error) => [400, 403, 422].includes(error.response?.status)

/**
 * Guarda lo que cambió desde el último "Siguiente" o "Analizar zona": las respuestas y,
 * si hay, la ubicación (con la ubicación, la API lo pasa a reporte guardado). Si el
 * análisis todavía no existe en la API (o ya no es accesible: 404), lo crea como borrador.
 */
async function persistChanges({ analysisId, categoryCode, subcategoryCode, answers, location }) {
  const currentAnswers = Object.fromEntries(
    Object.entries(answers).filter(([, optionCodes]) => optionCodes.length > 0),
  )
  let id = analysisId
  if (id) {
    try {
      await replaceAnalysisAnswers(id, currentAnswers)
    } catch (error) {
      if (error.response?.status === 404) id = null
      else if (!isValidationError(error)) throw error
    }
  }
  if (!id) {
    const analysis = await createAnalysis({ categoryCode, subcategoryCode, answers: currentAnswers })
    id = analysis.id
  }
  if (location) {
    try {
      await saveAnalysisLocation(id, location)
    } catch (error) {
      if (!isValidationError(error)) throw error
    }
  }
}

/**
 * Avisa al salir del flujo de análisis con cambios sin guardar:
 * - navegando dentro de la app hacia otra sección: frena la navegación y devuelve `open`
 *   para mostrar el modal propio, con las acciones para seguir o quedarse;
 * - cerrando o recargando la pestaña: confirmación nativa del navegador (beforeunload).
 * No avisa entre pasos del flujo, ni al ir a login/registro, ni con la zona ya analizada
 * sin cambios después (el reporte quedó guardado con "Analizar zona").
 */
export function useLeaveFlowGuard() {
  const flow = useAnalysisFlow()
  const { status: authStatus } = useAuth()
  const [action, setAction] = useState({ status: 'idle', error: null })
  // Con el rubro elegido ya hay algo que perder, hasta que se analiza la zona.
  // Cualquier cambio posterior (respuestas o ubicación) vuelve a dejar el reporte pendiente
  const hasUnsavedChanges = Boolean(flow.categoryCode) && !isReportReady(flow)
  // Para guardar hace falta dueño y las respuestas obligatorias del paso "Tu negocio"
  const canSave = authStatus === 'authenticated' && negocioStep.isComplete(flow)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      isFlowPath(currentLocation.pathname) &&
      !isFlowPath(nextLocation.pathname) &&
      !AUTH_PATHS.includes(nextLocation.pathname),
  )

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined
    const confirmUnload = (event) => {
      event.preventDefault()
      // Navegadores viejos piden returnValue para mostrar la confirmación
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', confirmUnload)
    return () => window.removeEventListener('beforeunload', confirmUnload)
  }, [hasUnsavedChanges])

  // Cierra el análisis en curso y sigue con la navegación frenada. Lo que no se
  // guardó se pierde; lo guardado antes queda en Mis reportes
  const leave = () => {
    flow.closeFlow()
    setAction({ status: 'idle', error: null })
    blocker.proceed?.()
  }

  const save = async () => {
    setAction({ status: 'saving', error: null })
    try {
      await persistChanges(flow)
      leave()
    } catch (error) {
      setAction({
        status: 'error',
        error: `No pudimos guardar los cambios: ${error.response?.data?.message ?? error.message}`,
      })
    }
  }

  const cancel = () => {
    setAction({ status: 'idle', error: null })
    blocker.reset?.()
  }

  return {
    open: blocker.state === 'blocked',
    canSave,
    saving: action.status === 'saving',
    error: action.error,
    save,
    leave,
    cancel,
  }
}
