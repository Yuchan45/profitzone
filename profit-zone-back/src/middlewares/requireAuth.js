import jwt from 'jsonwebtoken'
import { verifyAccessToken } from '../utils/tokens.js'

function unauthorized(message) {
  const error = new Error(message)
  error.status = 401
  return error
}

/**
 * Exige un JWT de acceso válido en `Authorization: Bearer <token>`.
 * Deja el usuario en req.user = { id, role }.
 */
export function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ')

  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('Tenés que iniciar sesión.')
  }

  try {
    req.user = verifyAccessToken(token)
  } catch (error) {
    // El front usa este mensaje/estado para renovar el token con /auth/refresh
    throw unauthorized(
      error instanceof jwt.TokenExpiredError ? 'Tu sesión venció.' : 'Sesión inválida.',
    )
  }

  next()
}
