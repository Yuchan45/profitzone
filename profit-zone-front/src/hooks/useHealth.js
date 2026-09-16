import { useEffect, useState } from 'react'
import { fetchHealth } from '../services/health.service.js'

/**
 * Chequea la conexión con la API al montar el componente.
 * Sirve como validación end-to-end de VITE_API_URL y del CORS del backend.
 */
export function useHealth() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false

    fetchHealth()
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
