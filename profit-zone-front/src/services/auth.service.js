import api, { refreshSession } from './api.js'
import { clearAccessToken, setAccessToken } from './authToken.js'

// Todas devuelven { user, accessToken } salvo logout. El refresh token nunca
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
