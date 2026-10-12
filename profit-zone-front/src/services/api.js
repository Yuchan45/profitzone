import axios from 'axios'
import { getAccessToken, notifySessionEnded, setAccessToken } from './authToken.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  // Manda y recibe la cookie httpOnly de refresh (solo viaja a /api/auth)
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Una sola renovación a la vez: las requests que fallen juntas esperan la misma.
let refreshPromise = null

/** POST /auth/refresh deduplicado. Devuelve { user, accessToken } y guarda el token. */
export function refreshSession() {
  refreshPromise ??= api
    .post('/auth/refresh')
    .then(({ data }) => {
      setAccessToken(data.accessToken)
      return data
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

// Endpoints donde un 401 no significa "token vencido": no se intenta renovar
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']

// Si el JWT de acceso venció (401), se renueva con la cookie y se reintenta una vez.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const skipRefresh = NO_REFRESH_PATHS.includes(config?.url)

    if (response?.status !== 401 || !config || config._retried || skipRefresh) {
      throw error
    }

    try {
      await refreshSession()
    } catch {
      notifySessionEnded()
      throw error
    }

    config._retried = true
    return api(config)
  },
)

export default api
