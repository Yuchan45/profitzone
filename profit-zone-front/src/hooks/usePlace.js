import { useEffect, useState } from 'react'
import { fetchPlace } from '../services/geo.service.js'

/** Ficha del negocio elegido en el mapa. Sin `id` no busca. status: 'idle' | 'loading' | 'ok' | 'error'. */
export function usePlace(id) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null, forId: null })

  useEffect(() => {
    if (id == null) return undefined
    let cancelled = false

    fetchPlace(id)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null, forId: id })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forId: id,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (id == null) return { status: 'idle', data: null, error: null }
  // Mientras llega la ficha de otro negocio no se muestra la anterior
  if (state.forId !== id) return { status: 'loading', data: null, error: null }
  return state
}
