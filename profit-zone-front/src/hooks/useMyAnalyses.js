import { useEffect, useState } from 'react'
import { fetchMyAnalyses } from '../services/analyses.service.js'

/** Trae los análisis guardados del usuario (Mis reportes) desde GET /api/analyses. */
export function useMyAnalyses() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false

    fetchMyAnalyses()
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
  }, [])

  return state
}
