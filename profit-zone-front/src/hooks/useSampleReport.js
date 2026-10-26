import { useCallback, useEffect, useState } from 'react'
import { fetchSampleReport } from '../services/sampleReport.service.js'

/**
 * Trae el reporte de ejemplo desde GET /api/sample-report. Devuelve lo mismo que
 * useAnalysisReport ({ status, data, error, retry }) para mostrarlo con ZoneAnalysis.
 */
export function useSampleReport() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', data: null, error: null, forAttempt: 0 })

  useEffect(() => {
    let cancelled = false

    fetchSampleReport()
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null, forAttempt: attempt })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forAttempt: attempt,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  // Mientras se reintenta, carga de nuevo (no se muestra el error anterior)
  if (state.forAttempt !== attempt) return { status: 'loading', data: null, error: null, retry }
  return { status: state.status, data: state.data, error: state.error, retry }
}
