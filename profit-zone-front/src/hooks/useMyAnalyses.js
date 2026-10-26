import { useCallback, useEffect, useState } from 'react'
import { fetchMyAnalyses } from '../services/analyses.service.js'

/**
 * Trae los análisis del usuario (Mis reportes) desde GET /api/analyses.
 * `status`: 'saved' (reportes guardados) o 'draft' (borradores).
 * `reload()` los vuelve a pedir (por ejemplo, después de eliminar un borrador).
 */
export function useMyAnalyses(status) {
  const [attempt, setAttempt] = useState(0)
  // `forKey` evita mostrar la lista de la otra pestaña mientras carga la nueva
  const key = `${status}:${attempt}`
  const [state, setState] = useState({ status: 'loading', data: null, error: null, forKey: key })

  useEffect(() => {
    let cancelled = false
    const forKey = `${status}:${attempt}`

    fetchMyAnalyses(status)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null, forKey })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forKey,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [status, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  // Al recargar se conserva la lista anterior hasta que llegue la nueva (no parpadea)
  const stale = state.forKey !== key
  if (stale && !state.forKey.startsWith(`${status}:`)) {
    return { status: 'loading', data: null, error: null, reload }
  }
  return { status: state.status, data: state.data, error: state.error, reload }
}
