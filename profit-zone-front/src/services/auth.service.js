import api, { refreshSession } from './api.js'
import { clearAccessToken, setAccessToken } from './authToken.js'

// register, login y restoreSession devuelven { user, accessToken }. El refresh token nunca
// pasa por JS: lo maneja el navegador como cookie httpOnly.

export async function register({ firstName, lastName, email, password }) {
  const { data } = await api.post('/auth/register', { firstName, lastName, email, password })
  setAccessToken(data.accessToken)
  return data
}

export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password })
  setAccessToken(data.accessToken)
  return data
}

/** Client ID público de Google, o null si "Continuar con Google" no está configurado. */
export async function fetchGoogleClientId() {
  const { data } = await api.get('/auth/google/config')
  return data.clientId
}

/** Entra (o crea la cuenta) con el ID token que entrega el botón de Google. */
export async function googleLogin(idToken) {
  const { data } = await api.post('/auth/google', { idToken })
  setAccessToken(data.accessToken)
  return data
}

/** Recupera la sesión con la cookie de refresh (al cargar la app o con el token vencido). */
export function restoreSession() {
  return refreshSession()
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } finally {
    clearAccessToken()
  }
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data.user
}

/** Pide el link para restablecer la contraseña. Responde lo mismo exista o no la cuenta. */
export async function requestPasswordReset(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

/** Cambia la contraseña con el token del link. El back cierra todas las sesiones de la cuenta. */
export async function resetPassword({ token, password }) {
  await api.post('/auth/reset-password', { token, password })
}
