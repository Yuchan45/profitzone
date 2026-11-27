import { useEffect, useState } from 'react'
import { syncOrder } from '../services/billing.service.js'
import { useAuth } from './useAuth.js'

const LOADING = { status: 'loading', data: null, error: null }
const NO_ORDER = { status: 'error', data: null, error: 'Falta la compra.' }

/**
 * Vuelta del pago: le pide a la API que verifique cómo quedó la compra (y la acredite si se
 * aprobó) y actualiza el saldo de la barra. data: { order, credits }.
 * status: 'loading' | 'ok' | 'error'. Sin `orderId` responde error.
 */
export function useOrderSync(orderId) {
  const { setCredits } = useAuth()
  const [state, setState] = useState({ ...LOADING, forId: null })

  useEffect(() => {
    if (!orderId) return undefined
    let cancelled = false

    syncOrder(orderId)
      .then((data) => {
        if (cancelled) return
        if (data.credits) setCredits(data.credits)
        setState({ status: 'ok', data, error: null, forId: orderId })
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
  }, [orderId, setCredits])

  if (!orderId) return NO_ORDER
  if (state.forId !== orderId) return LOADING
  return { status: state.status, data: state.data, error: state.error }
}
