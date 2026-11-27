import { useCallback, useEffect, useState } from 'react'
import { fetchCreditsSummary } from '../services/billing.service.js'
import { useAuth } from './useAuth.js'

const LOADING = { status: 'loading', data: null, error: null }

/**
 * Saldo y últimos movimientos de créditos del usuario (GET /api/billing/credits).
 * data: { credits: { free, paid, total }, transactions: [...] }. `reload()` vuelve a pedirlo.
 */
export function useCreditsSummary() {
  const { setCredits } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ ...LOADING, forAttempt: 0 })

  useEffect(() => {
    let cancelled = false

    fetchCreditsSummary()
      .then((data) => {
        if (cancelled) return
        setCredits(data.credits)
        setState({ status: 'ok', data, error: null, forAttempt: attempt })
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
  }, [attempt, setCredits])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  if (state.forAttempt !== attempt) return { ...LOADING, reload }
  return { status: state.status, data: state.data, error: state.error, reload }
}
