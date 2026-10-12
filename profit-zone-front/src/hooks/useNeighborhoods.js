import { useEffect, useState } from 'react'
import { fetchNeighborhoods } from '../services/geo.service.js'

/** Trae los barrios disponibles para analizar desde GET /api/neighborhoods. */
export function useNeighborhoods() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false

    fetchNeighborhoods()
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
