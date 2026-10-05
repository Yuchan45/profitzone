import { useRef, useState } from 'react'
import { searchAddresses } from '../services/geo.service.js'

/**
 * Búsqueda de direcciones a pedido (al enviar el buscador).
 * status: 'idle' | 'loading' | 'ok' | 'error'. Si el usuario busca de nuevo antes
 * de que vuelva la respuesta anterior, la vieja se descarta.
 */
export function useAddressSearch() {
  const [state, setState] = useState({ status: 'idle', results: [], error: null })
  const lastRequest = useRef(0)

  const search = async (query) => {
    const request = ++lastRequest.current
    setState({ status: 'loading', results: [], error: null })
    try {
      const results = await searchAddresses(query)
      if (request === lastRequest.current) setState({ status: 'ok', results, error: null })
    } catch (error) {
      if (request === lastRequest.current) {
        setState({
          status: 'error',
          results: [],
          error: error.response?.data?.message ?? error.message,
        })
      }
    }
  }

  const clear = () => {
    lastRequest.current += 1
    setState({ status: 'idle', results: [], error: null })
  }

  return { ...state, search, clear }
}
