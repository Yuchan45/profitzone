import { useEffect, useState, useCallback } from 'react'
import {
  fetchProfile,
  updateProfile,
  updatePassword,
  toggleGoogleAccount,
  deleteAccount,
  setProfileMockOwner,
} from '../services/profile.service.js'

/** Perfil del usuario. `userId` (primitivo) es el de la sesión: cada cuenta tiene su perfil. */
export function useProfile(userId) {
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: null,
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let cancelled = false

    // Mientras el perfil sea mock, se guarda por usuario
    setProfileMockOwner(userId)

    fetchProfile()
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'ok', data, error: null })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            status: 'error',
            data: null,
            error: error.response?.data?.message ?? error.message,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const savePersonalData = useCallback(async (fields) => {
    setIsUpdating(true)
    setActionError(null)
    try {
      const updated = await updateProfile(fields)
      setState((prev) => ({ ...prev, data: updated }))
      return updated
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message
      setActionError(msg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    setIsUpdating(true)
    setActionError(null)
    try {
      const res = await updatePassword({ currentPassword, newPassword })
      return res
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message
      setActionError(msg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const toggleGoogle = useCallback(async () => {
    setIsUpdating(true)
    setActionError(null)
    try {
      const updated = await toggleGoogleAccount()
      setState((prev) => ({ ...prev, data: updated }))
      return updated
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message
      setActionError(msg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const setAvatar = useCallback(async (avatarUrl) => {
    setIsUpdating(true)
    setActionError(null)
    try {
      const updated = await updateProfile({ avatarUrl })
      setState((prev) => ({ ...prev, data: updated }))
      return updated
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message
      setActionError(msg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const removeAvatar = useCallback(async () => {
    setIsUpdating(true)
    setActionError(null)
    try {
      const updated = await updateProfile({ avatarUrl: null })
      setState((prev) => ({ ...prev, data: updated }))
      return updated
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
      setState({ status: 'ok', data: null, error: null })
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message
      setActionError(msg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [])

  return {
    status: state.status,
    profile: state.data,
    error: state.error,
    isUpdating,
    actionError,
    savePersonalData,
    changePassword,
    toggleGoogle,
    setAvatar,
    removeAvatar,
    deleteProfile,
  }
}
