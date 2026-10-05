import { useEffect, useState } from 'react'
import { fetchCategories } from '../services/catalog.service.js'

/**
 * Trae las categorías con sus subcategorías desde GET /api/categories.
 * Por defecto solo las activas, que son las que el usuario puede elegir.
 */
export function useCategories(active = true) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false

    fetchCategories(active)
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
  }, [active])

  return state
}
