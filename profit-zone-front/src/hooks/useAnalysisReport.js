import { useEffect, useState } from 'react'
import { fetchAnalysisReport } from '../services/analyses.service.js'

const LOADING = { status: 'loading', data: null, error: null }

/** Trae el reporte de zona de un análisis desde GET /api/analyses/:id/report. */
export function useAnalysisReport(analysisId) {
  // `forId` evita mostrar el reporte anterior mientras carga el de otro análisis
  // (React Router reutiliza la página al cambiar el :id)
  const [state, setState] = useState({ ...LOADING, forId: analysisId })

  useEffect(() => {
    let cancelled = false

    fetchAnalysisReport(analysisId)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null, forId: analysisId })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forId: analysisId,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [analysisId])

  if (state.forId !== analysisId) return LOADING
  const { status, data, error } = state
  return { status, data, error }
}
