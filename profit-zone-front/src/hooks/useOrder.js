import { useEffect, useState } from 'react'
import { fetchOrder } from '../services/billing.service.js'

const LOADING = { status: 'loading', data: null, error: null }

/**
 * Una compra del usuario (GET /api/billing/orders/:id). data: { order, credits }.
 * status: 'loading' | 'ok' | 'error'.
 */
export function useOrder(orderId) {
  const [state, setState] = useState({ ...LOADING, forId: null })

  useEffect(() => {
    let cancelled = false

    fetchOrder(orderId)
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null, forId: orderId })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forId: orderId,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [orderId])

  if (state.forId !== orderId) return LOADING
  return { status: state.status, data: state.data, error: state.error }
}
