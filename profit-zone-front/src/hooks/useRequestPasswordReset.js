import { useCallback } from 'react'
import { requestPasswordReset } from '../services/auth.service.js'
import { getApiErrorMessage } from '../utils/apiErrors.js'

/** Solicita el envío del correo de recuperación de contraseña. */
export function useRequestPasswordReset() {
  return useCallback(async (email) => {
    try {
      await requestPasswordReset(email)
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }, [])
}
