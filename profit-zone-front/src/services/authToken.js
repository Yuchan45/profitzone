// JWT de acceso guardado SOLO en memoria (nunca en localStorage: quedaría
// expuesto a XSS). Al recargar la página se pierde y se recupera con la
// cookie httpOnly de refresh (POST /auth/refresh).

let accessToken = null
const sessionEndListeners = new Set()

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

/** Avisa que la sesión terminó (refresh fallido): el AuthContext pasa a anónimo. */
export function notifySessionEnded() {
  accessToken = null
  sessionEndListeners.forEach((listener) => listener())
}

export function onSessionEnded(listener) {
  sessionEndListeners.add(listener)
  return () => sessionEndListeners.delete(listener)
}
