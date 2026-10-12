/**
 * Exige que el usuario autenticado tenga alguno de los roles indicados.
 * Va siempre después de requireAuth: router.get('/', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('No tenés permiso para acceder a este recurso.')
      error.status = 403
      throw error
    }
    next()
  }
}
