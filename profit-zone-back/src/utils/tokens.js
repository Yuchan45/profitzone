import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const JWT_ALGORITHM = 'HS256'
const JWT_ISSUER = 'profitzone'

/** JWT de acceso de vida corta: { sub: userId, role }. */
export function signAccessToken(user) {
  return jwt.sign({ role: user.role }, env.auth.jwtAccessSecret, {
    algorithm: JWT_ALGORITHM,
    subject: user.id,
    issuer: JWT_ISSUER,
    expiresIn: env.auth.jwtAccessTtl,
  })
}

/**
 * Verifica un JWT de acceso. Devuelve { id, role } o lanza el error de
 * jsonwebtoken (TokenExpiredError, JsonWebTokenError).
 */
export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.auth.jwtAccessSecret, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
  })
  return { id: payload.sub, role: payload.role }
}

/**
 * Refresh token opaco (no JWT): 32 bytes aleatorios. Se manda en la cookie y
 * en la DB solo se guarda su SHA-256.
 */
export function generateOpaqueToken() {
  return randomBytes(32).toString('base64url')
}

/** SHA-256 en hex (64 caracteres, entra en auth_tokens.token_hash char(64)). */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}
