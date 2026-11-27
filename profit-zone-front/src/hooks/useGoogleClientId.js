import { useEffect, useState } from 'react'
import { fetchGoogleClientId } from '../services/auth.service.js'

// El Client ID no cambia mientras la pestaña está abierta: se pide una sola vez y se comparte
let clientIdPromise = null

function loadClientId() {
  clientIdPromise ??= fetchGoogleClientId().catch((error) => {
    clientIdPromise = null
    throw error
  })
  return clientIdPromise
}

/**
 * Client ID público de Google para "Continuar con Google" (GET /api/auth/google/config).
 * data: el Client ID, o null si el ingreso con Google no está configurado en la API.
 * status: 'loading' | 'ok' | 'error'.
 */
export function useGoogleClientId() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    let cancelled = false

    loadClientId()
      .then((clientId) => {
        if (!cancelled) setState({ status: 'ok', data: clientId ?? null, error: null })
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ status: 'error', data: null, error: error.response?.data?.message ?? error.message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
