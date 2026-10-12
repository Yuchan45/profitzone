import { env } from '../config/env.js'
import { getMe, login, logout, refresh, register } from '../services/auth.service.js'

export const REFRESH_COOKIE = 'pz_refresh'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN = 8
const PASSWORD_MAX = 128

// La cookie solo viaja a /api/auth (no a toda la API) y JS no la puede leer.
function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: 'strict',
    path: '/api/auth',
  }
}

function badRequest(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function requestMeta(req) {
  return { userAgent: req.get('user-agent')?.slice(0, 300) ?? null, ip: req.ip ?? null }
}

function readString(body, field) {
  const value = body?.[field]
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeEmail(body) {
  return readString(body, 'email').toLowerCase()
}

/** Setea la cookie de refresh y responde { user, accessToken } (sin el refresh en el body). */
function sendSession(res, status, { user, accessToken, refreshToken }) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...cookieOptions(),
    maxAge: env.auth.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  })
  res.status(status).json({ user, accessToken })
}

export async function postRegister(req, res) {
  const firstName = readString(req.body, 'firstName')
  const lastName = readString(req.body, 'lastName')
  const email = normalizeEmail(req.body)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!firstName || firstName.length > 100) throw badRequest('Ingresá tu nombre (hasta 100 caracteres).')
  if (!lastName || lastName.length > 100) throw badRequest('Ingresá tu apellido (hasta 100 caracteres).')
  if (!EMAIL_PATTERN.test(email) || email.length > 320) throw badRequest('Ingresá un correo válido.')
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    throw badRequest(`La contraseña tiene que tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`)
  }

  const session = await register({ firstName, lastName, email, password }, requestMeta(req))
  sendSession(res, 201, session)
}

export async function postLogin(req, res) {
  const email = normalizeEmail(req.body)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!email || !password) throw badRequest('Ingresá tu correo y tu contraseña.')
  // Un tope evita gastar scrypt en contraseñas gigantes
  if (password.length > PASSWORD_MAX) throw badRequest('Correo o contraseña incorrectos.')

  const session = await login({ email, password }, requestMeta(req))
  sendSession(res, 200, session)
}

export async function postRefresh(req, res) {
  try {
    const session = await refresh(req.cookies?.[REFRESH_COOKIE], requestMeta(req))
    sendSession(res, 200, session)
  } catch (error) {
    // Cookie inválida o vencida: se borra para no volver a intentar con ella
    if (error.status === 401) res.clearCookie(REFRESH_COOKIE, cookieOptions())
    throw error
  }
}

export async function postLogout(req, res) {
  await logout(req.cookies?.[REFRESH_COOKIE])
  res.clearCookie(REFRESH_COOKIE, cookieOptions())
  res.status(204).end()
}

export async function getCurrentUser(req, res) {
  res.json({ user: await getMe(req.user.id) })
}
