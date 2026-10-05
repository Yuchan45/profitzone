import api from './api.js'

/**
 * Flag para alternar entre Mock y Backend real.
 * Cuando los endpoints del backend estén disponibles, cambiar USE_MOCK a false.
 */
export const USE_MOCK = true

// Mock por usuario: cada cuenta tiene su propio perfil en localStorage, así una
// cuenta nueva arranca vacía (sin foto ni actividad) y no hereda datos de otra.
// Nombre, correo y fecha de alta salen de la sesión real (useAuth), no de acá.
const MOCK_STORAGE_PREFIX = 'profitzone_profile_mock_v2'
let mockOwnerId = 'anonymous'

// Limpia el mock anterior (v1, compartido y con foto de template)
try {
  localStorage.removeItem('profitzone_profile_mock_v1')
} catch {
  // localStorage bloqueado: no hay nada que limpiar
}

/** Indica de qué usuario es el perfil mock (lo llama useProfile con el id de la sesión). */
export function setProfileMockOwner(userId) {
  mockOwnerId = userId ?? 'anonymous'
}

function mockStorageKey() {
  return `${MOCK_STORAGE_PREFIX}:${mockOwnerId}`
}

const initialMockProfile = {
  // Sin foto: la UI muestra el avatar vacío por defecto
  avatarUrl: null,
  googleLinked: false,
  savedReportsCount: 0,
  lastAnalysisDate: null,
}

function getStoredMock() {
  const key = mockStorageKey()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialMockProfile))
      return initialMockProfile
    }
    return JSON.parse(raw)
  } catch {
    return initialMockProfile
  }
}

function setStoredMock(data) {
  try {
    localStorage.setItem(mockStorageKey(), JSON.stringify(data))
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
    localStorage.removeItem(mockStorageKey())
    return { success: true }
  }

  const { data } = await api.delete('/profile')
  return data
}
