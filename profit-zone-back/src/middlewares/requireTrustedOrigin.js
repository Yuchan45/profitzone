import { env } from '../config/env.js'

/**
 * Defensa CSRF para las rutas que actúan con la cookie de refresh: si el
 * navegador manda Origin, tiene que ser uno de CORS_ORIGINS. Sin Origin
 * (curl, Postman) no es un ataque CSRF, así que se deja pasar.
 */
export function requireTrustedOrigin(req, res, next) {
  const origin = req.get('origin')
  if (origin && !env.corsOrigins.includes(origin)) {
    const error = new Error('Origen no permitido.')
    error.status = 403
    throw error
  }
  next()
}
