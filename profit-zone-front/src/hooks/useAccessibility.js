import { useEffect, useState } from 'react'
import { getAccessibility } from '../services/accessibility.service.js'

/**
 * Consulta la accesibilidad y transporte público en el radio de una ubicación.
 * status: 'idle' | 'loading' | 'ok' | 'error'.
 */
export function useAccessibility({ lat, lng, radius } = {}) {
  const enabled = lat != null && lng != null
  const [state, setState] = useState(() => ({
    status: enabled ? 'loading' : 'idle',
    data: null,
    error: null,
  }))

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    getAccessibility({ lat, lng, radius })
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
  }, [enabled, lat, lng, radius])

  return enabled ? state : { status: 'idle', data: null, error: null }
}
