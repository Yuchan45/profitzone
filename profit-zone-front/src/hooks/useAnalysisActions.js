import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAnalysis, fetchAnalysis, renameAnalysis } from '../services/analyses.service.js'
import { flowStateFromAnalysis, writeFlowState } from '../utils/analysisFlowStorage.js'

const IDLE = { pendingId: null, error: null }

/**
 * Acciones sobre los análisis de Mis reportes.
 * - `resume(id)`: carga un borrador en el flujo y sigue desde Ubicación. Al analizar
 *   la zona se guarda como reporte.
 * - `remove(id)`: elimina un borrador o un reporte guardado.
 * - `rename(id, name)`: le pone nombre (vacío: vuelve al rubro).
 * Cada una devuelve true si salió bien. `pendingId` es el análisis con una acción en
 * curso y `error` es { id, action, message } de la última que falló, para mostrarlo
 * donde corresponde (en la fila, en un modal o arriba de la lista).
 */
export function useAnalysisActions() {
  const navigate = useNavigate()
  const [state, setState] = useState(IDLE)

  const run = async (analysisId, action, task) => {
    setState({ pendingId: analysisId, error: null })
    try {
      await task()
      setState(IDLE)
      return true
    } catch (error) {
      setState({
        pendingId: null,
        error: { id: analysisId, action, message: error.response?.data?.message ?? error.message },
      })
      return false
    }
  }

  const resume = (analysisId) =>
    run(analysisId, 'resume', async () => {
      writeFlowState(flowStateFromAnalysis(await fetchAnalysis(analysisId)))
      navigate('/analizar/ubicacion')
    })

  const remove = (analysisId) => run(analysisId, 'remove', () => deleteAnalysis(analysisId))

  const rename = (analysisId, name) => run(analysisId, 'rename', () => renameAnalysis(analysisId, name))

  // Mensaje de la última acción que falló, si fue `action` sobre `analysisId`
  const errorFor = (action, analysisId) =>
    state.error?.action === action && state.error.id === analysisId ? state.error.message : null

  // Para descartar el error al cerrar un modal o cancelar una edición
  const clearError = () => setState((prev) => ({ ...prev, error: null }))

  return { pendingId: state.pendingId, error: state.error, errorFor, resume, remove, rename, clearError }
}
