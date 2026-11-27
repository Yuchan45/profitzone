import { useEffect, useState } from 'react'
import { fetchCategories } from '../services/catalog.service.js'

const LOADING = { status: 'loading', data: null, error: null }

/**
 * Trae las categorías con sus subcategorías desde GET /api/categories.
 * Por defecto solo las activas, que son las que el usuario puede elegir.
 */
export function useCategories(active = true) {
  const key = String(active)
  const [state, setState] = useState({ ...LOADING, forKey: null })

  useEffect(() => {
    let cancelled = false
    const forKey = String(active)

    fetchCategories(active)
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
  }, [active])

  if (state.forKey !== key) return LOADING
  return { status: state.status, data: state.data, error: state.error }
}
