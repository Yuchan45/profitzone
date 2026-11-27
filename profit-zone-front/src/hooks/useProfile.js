import { useEffect, useState, useCallback } from 'react'
import {
  fetchProfile,
  updateProfile,
  updatePassword,
  deleteAccount,
} from '../services/profile.service.js'
import { useAuth } from './useAuth.js'

const LOADING = { status: 'loading', data: null, error: null }
const IDLE = { status: 'idle', data: null, error: null }

/** Perfil del usuario autenticado. `userId` (primitivo) reinicia el estado al cambiar de cuenta. */
export function useProfile(userId) {
  const { updateUser, logout } = useAuth()
  const key = userId ?? null
  const [state, setState] = useState({ ...LOADING, forKey: null })
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    if (!key) return undefined
    let cancelled = false

    fetchProfile()
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'ok', data, error: null, forKey: key })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
            forKey: key,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [key])

  const savePersonalData = useCallback(
    async (fields) => {
      setIsUpdating(true)
      setActionError(null)
      try {
        const updated = await updateProfile(fields)
        setState((prev) => ({ ...prev, data: updated }))
        updateUser({
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
        })
        return updated
      } catch (err) {
        const msg = err.response?.data?.message ?? err.message
        setActionError(msg)
        throw err
      } finally {
        setIsUpdating(false)
      }
    },
    [updateUser],
  )

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    setIsUpdating(true)
    setActionError(null)
    try {
      return await updatePassword({ currentPassword, newPassword })
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message
      setActionError(msg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const deleteProfile = useCallback(async () => {
    setIsUpdating(true)
    setActionError(null)
    try {
      await deleteAccount()
      setState({ status: 'ok', data: null, error: null, forKey: null })
      await logout().catch(() => {})
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message
      setActionError(msg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [logout])

  const resolved = !key
    ? IDLE
    : state.forKey !== key
      ? LOADING
      : { status: state.status, data: state.data, error: state.error }

  return {
    status: resolved.status,
    profile: resolved.data,
    error: resolved.error,
    isUpdating,
    actionError,
    savePersonalData,
    changePassword,
    deleteProfile,
  }
}
