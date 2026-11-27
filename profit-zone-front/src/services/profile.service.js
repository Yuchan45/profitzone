import api from './api.js'

/** Obtiene los datos del perfil y el resumen de actividad del usuario autenticado. */
export async function fetchProfile() {
  const { data } = await api.get('/profile')
  return data
}

/** Actualiza los datos personales (nombre, apellido, email). */
export async function updateProfile(payload) {
  const { data } = await api.put('/profile', payload)
  return data
}

/** Actualiza la contraseña del usuario autenticado. */
export async function updatePassword({ currentPassword, newPassword }) {
  const { data } = await api.put('/profile/password', {
    currentPassword,
    newPassword,
  })
  return data
}

/** Elimina la cuenta del usuario y todos sus análisis. */
export async function deleteAccount() {
  await api.delete('/profile')
}
