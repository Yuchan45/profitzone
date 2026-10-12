import { useCallback, useRef, useState } from 'react'
import { reverseGeocode } from '../services/geo.service.js'

/**
 * Dirección del punto elegido en el mapa, a pedido. `lookup(point)` devuelve la
 * dirección (o null si no hay una cerca, si falló o si ya se pidió otra después:
 * la respuesta vieja se descarta). status: 'idle' | 'loading'.
 */
export function useReverseGeocode() {
  const [status, setStatus] = useState('idle')
  const lastRequest = useRef(0)

  const lookup = useCallback(async (point) => {
    const request = ++lastRequest.current
    setStatus('loading')
    try {
      const { label } = await reverseGeocode(point)
      return request === lastRequest.current ? label : null
    } catch {
      // Sin dirección el mapa sigue funcionando: el buscador queda vacío
      return null
    } finally {
      if (request === lastRequest.current) setStatus('idle')
    }
  }, [])

  // Descarta una búsqueda en curso (ej. el usuario eligió una dirección del buscador)
  const cancel = useCallback(() => {
    lastRequest.current += 1
    setStatus('idle')
  }, [])

  return { status, lookup, cancel }
}
