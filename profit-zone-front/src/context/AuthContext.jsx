import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContextValue.js'
import * as authService from '../services/auth.service.js'
import { onSessionEnded } from '../services/authToken.js'

/**
 * Sesión del usuario.
 * status: 'loading' (recuperando la sesión al cargar) | 'authenticated' | 'anonymous'.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null })

  // Al cargar la app: si hay cookie de refresh válida, se recupera la sesión
  useEffect(() => {
    let cancelled = false

    authService
      .restoreSession()
      .then(({ user }) => {
        if (!cancelled) setState({ status: 'authenticated', user })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'anonymous', user: null })
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Si una renovación falla en medio de la navegación, la sesión termina
  useEffect(
    () => onSessionEnded(() => setState({ status: 'anonymous', user: null })),
    [],
  )

  // Estables (no cambian con el estado): los hooks los usan como dependencia de efectos
  // Saldo de créditos: se actualiza con lo que devuelve la API (compra, análisis, reporte)
  const setCredits = useCallback(
    (credits) =>
      setState((prev) => (prev.user ? { ...prev, user: { ...prev.user, credits } } : prev)),
    [],
  )
  // Vuelve a pedir el usuario (ej. después de analizar, para ver el saldo nuevo)
  const refreshUser = useCallback(async () => {
    const user = await authService.fetchMe()
    setState((prev) => (prev.status === 'authenticated' ? { ...prev, user } : prev))
    return user
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      setCredits,
      refreshUser,
      register: async (payload) => {
        const { user } = await authService.register(payload)
        setState({ status: 'authenticated', user })
        return user
      },
      login: async (credentials) => {
        const { user } = await authService.login(credentials)
        setState({ status: 'authenticated', user })
        return user
      },
      logout: async () => {
        try {
          await authService.logout()
        } finally {
          setState({ status: 'anonymous', user: null })
        }
      },
    }),
    [state, setCredits, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
