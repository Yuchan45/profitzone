import jwt from 'jsonwebtoken'
import { httpError } from '../utils/httpErrors.js'
import { verifyAccessToken } from '../utils/tokens.js'

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i

/**
 * Exige un JWT de acceso válido en `Authorization: Bearer <token>`.
 * Deja el usuario en req.user = { id, role }.
 */
export function requireAuth(req, res, next) {
  const match = BEARER_PATTERN.exec((req.get('authorization') ?? '').trim())
  const token = match?.[1]

  if (!token) {
    throw httpError(401, 'Tenés que iniciar sesión.')
  }

  try {
    req.user = verifyAccessToken(token)
  } catch (error) {
    // El front usa este mensaje/estado para renovar el token con /auth/refresh
    throw httpError(401, error instanceof jwt.TokenExpiredError ? 'Tu sesión venció.' : 'Sesión inválida.')
  }

  next()
}
