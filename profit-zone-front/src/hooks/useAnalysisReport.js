import { useEffect, useState } from 'react'
import { fetchAnalysisReport } from '../services/analyses.service.js'

/** Trae el reporte de zona de un análisis desde GET /api/analyses/:id/report. */
export function useAnalysisReport(analysisId) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false

    fetchAnalysisReport(analysisId)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [analysisId])

  return state
}
