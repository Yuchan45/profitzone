import { useCallback, useEffect, useState } from 'react'
import { fetchPacks } from '../services/billing.service.js'

const LOADING = { status: 'loading', data: null, error: null }

/**
 * Packs de créditos con su precio en dólares y en pesos (público, sin sesión).
 * data: { provider, usdArsRate, rateSource, packs: [{ code, credits, priceUsd, priceArs,
 * pricePerCreditUsd, savingPercent }] }. `retry()` vuelve a pedirlos.
 */
export function usePacks() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ ...LOADING, forAttempt: 0 })

  useEffect(() => {
    let cancelled = false

    fetchPacks()
      .then((data) => {
        if (!cancelled) setState({ status: 'ok', data, error: null, forAttempt: attempt })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forAttempt: attempt,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  if (state.forAttempt !== attempt) return { ...LOADING, retry }
  return { status: state.status, data: state.data, error: state.error, retry }
}
