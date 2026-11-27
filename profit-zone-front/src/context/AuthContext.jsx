import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContextValue.js'
import * as authService from '../services/auth.service.js'
import { getAuthGeneration, onSessionEnded } from '../services/authToken.js'
import { clearFlowState } from '../utils/analysisFlowStorage.js'
import { clearReportCache } from '../hooks/useAnalysisReport.js'

/**
 * Sesión del usuario.
 * status: 'loading' (recuperando la sesión al cargar) | 'authenticated' | 'anonymous'.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null })

  // Al cargar la app: si hay cookie de refresh válida, se recupera la sesión
  useEffect(() => {
    let cancelled = false
    const generation = getAuthGeneration()

    authService
      .restoreSession()
      .then(({ user }) => {
        if (!cancelled && generation === getAuthGeneration()) {
          setState({ status: 'authenticated', user })
        }
      })
      .catch(() => {
        if (!cancelled && generation === getAuthGeneration()) {
          setState({ status: 'anonymous', user: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Si una renovación falla en medio de la navegación, la sesión termina
  useEffect(
    () =>
      onSessionEnded(() => {
        clearReportCache()
        setState({ status: 'anonymous', user: null })
      }),
    [],
  )

  const value = useMemo(
    () => ({
      ...state,
      register: async (payload) => {
        const { user } = await authService.register(payload)
        clearReportCache()
        setState({ status: 'authenticated', user })
        return user
      },
      login: async (credentials) => {
        const { user } = await authService.login(credentials)
        clearReportCache()
        setState((prev) => {
          if (prev.user?.id && prev.user.id !== user.id) clearFlowState()
          return { status: 'authenticated', user }
        })
        return user
      },
      updateUser: (partialUser) => {
        setState((prev) =>
          prev.user ? { ...prev, user: { ...prev.user, ...partialUser } } : prev,
        )
      },
      logout: async () => {
        try {
          await authService.logout()
        } finally {
          clearFlowState()
          clearReportCache()
          setState({ status: 'anonymous', user: null })
        }
      },
    }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
