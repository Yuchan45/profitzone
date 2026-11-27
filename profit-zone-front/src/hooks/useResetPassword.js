import { useCallback } from 'react'
import { resetPassword } from '../services/auth.service.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

/** Restablece la contraseña usando el token de recuperación. */
export function useResetPassword() {
  return useCallback(async ({ token, password }) => {
    try {
      await resetPassword({ token, password })
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }, [])
}
