import api from './api.js'

/**
 * Flag para alternar entre Mock y Backend real.
 * Cuando los endpoints del backend estén disponibles, cambiar USE_MOCK a false.
 */
export const USE_MOCK = true

const MOCK_STORAGE_KEY = 'profitzone_profile_mock_v1'

const initialMockProfile = {
  id: 'usr_carlos_mendoza',
  firstName: 'Carlos',
  lastName: 'Mendoza',
  email: 'carlos@correo.com',
  avatarUrl:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces&auto=format&q=80',
  memberSince: 'septiembre 2026',
  googleLinked: false,
  savedReportsCount: 5,
  lastAnalysisDate: '27/09/2026',
}

function getStoredMock() {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockProfile))
      return initialMockProfile
    }
    return JSON.parse(raw)
  } catch {
    return initialMockProfile
  }
}

function setStoredMock(data) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignorar error de cuota o localStorage
  }
}

/**
 * Obtiene los datos del perfil del usuario
 */
export async function fetchProfile() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    return getStoredMock()
  }

  const { data } = await api.get('/profile')
  return data
}

/**
 * Actualiza los datos personales (nombre, apellido, email, avatar)
 */
export async function updateProfile(payload) {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    const current = getStoredMock()
    const updated = {
      ...current,
      ...payload,
    }
    setStoredMock(updated)
    return updated
  }

  const { data } = await api.put('/profile', payload)
  return data
}

/**
 * Actualiza la contraseña del usuario
 */
export async function updatePassword({ currentPassword, newPassword }) {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    if (!currentPassword) {
      throw Object.assign(new Error('Ingresá tu contraseña actual'), { status: 400 })
    }
    if (!newPassword || newPassword.length < 8) {
      throw Object.assign(
        new Error('La nueva contraseña debe tener al menos 8 caracteres'),
        { status: 400 },
      )
    }
    return { success: true, message: 'Contraseña actualizada con éxito' }
  }

  const { data } = await api.put('/profile/password', {
    currentPassword,
    newPassword,
  })
  return data
}

/**
 * Vincula o desvincula la cuenta de Google
 */
export async function toggleGoogleAccount() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    const current = getStoredMock()
    const updated = {
      ...current,
      googleLinked: !current.googleLinked,
    }
    setStoredMock(updated)
    return updated
  }

  const { data } = await api.post('/profile/google-toggle')
  return data
}

/**
 * Elimina la cuenta del usuario
 */
export async function deleteAccount() {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    localStorage.removeItem(MOCK_STORAGE_KEY)
    return { success: true }
  }

  const { data } = await api.delete('/profile')
  return data
}
