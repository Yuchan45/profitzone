import { useEffect, useState } from 'react'
import { fetchNearbyPlaces } from '../services/geo.service.js'

// Espera a que el usuario deje de mover el pin o el radio antes de buscar
const DEBOUNCE_MS = 350

/**
 * Negocios del rubro dentro del círculo, para la vista previa del mapa (paso 3).
 * No busca sin punto (`lat`/`lng` null). status: 'idle' | 'loading' | 'ok' | 'error'.
 */
export function useNearbyPlaces({ lat, lng, radius, category, subcategory, match }) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null })
  const enabled = lat != null && lng != null && Boolean(category && subcategory)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    const timer = setTimeout(() => {
      // Se conservan los puntos anteriores mientras llegan los nuevos (no parpadea)
      setState((prev) => ({ ...prev, status: 'loading', error: null }))
      fetchNearbyPlaces({ lat, lng, radius, category, subcategory, match })
        .then((data) => {
          if (!cancelled) setState({ status: 'ok', data, error: null })
        })
        .catch((error) => {
          if (!cancelled) {
            setState({ status: 'error', data: null, error: error.response?.data?.message ?? error.message })
          }
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [enabled, lat, lng, radius, category, subcategory, match])

  return enabled ? state : { status: 'idle', data: null, error: null }
}
