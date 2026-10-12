import { requireAuth } from './requireAuth.js'

/**
 * Como requireAuth, pero sin sesión deja req.user = null en vez de responder 401.
 * Si viene un token inválido o vencido sí responde 401, para que el front lo renueve.
 */
export function optionalAuth(req, res, next) {
  if (!req.get('authorization')) {
    req.user = null
    next()
    return
  }
  requireAuth(req, res, next)
}
