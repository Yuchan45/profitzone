import {
  deleteProfile as deleteUserProfile,
  getProfile as getUserProfile,
  updateProfile as updateUserProfile,
  updateProfilePassword,
} from '../services/profile.service.js'
import { httpError } from '../utils/httpErrors.js'
import {
  EMAIL_PATTERN,
  PASSWORD_MAX,
  PASSWORD_MIN,
  REFRESH_COOKIE,
  cookieOptions,
} from './auth.controller.js'

function readString(body, field) {
  const value = body?.[field]
  return typeof value === 'string' ? value.trim() : ''
}

export async function getProfile(req, res) {
  res.json(await getUserProfile(req.user.id))
}

export async function putProfile(req, res) {
  const firstName = readString(req.body, 'firstName')
  const lastName = readString(req.body, 'lastName')
  const email = readString(req.body, 'email').toLowerCase()

  if (!firstName || firstName.length > 100) throw httpError(400, 'Ingresá tu nombre (hasta 100 caracteres).')
  if (!lastName || lastName.length > 100) throw httpError(400, 'Ingresá tu apellido (hasta 100 caracteres).')
  if (!EMAIL_PATTERN.test(email) || email.length > 320) throw httpError(400, 'Ingresá un correo válido.')

  res.json(await updateUserProfile(req.user.id, { firstName, lastName, email }))
}

export async function putProfilePassword(req, res) {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''

  if (!currentPassword) throw httpError(400, 'Ingresá tu contraseña actual.')
  if (currentPassword.length > PASSWORD_MAX) throw httpError(400, 'La contraseña actual es incorrecta.')
  if (newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
    throw httpError(400, `La nueva contraseña tiene que tener entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres.`)
  }

  res.json(
    await updateProfilePassword(
      req.user.id,
      { currentPassword, newPassword },
      req.cookies?.[REFRESH_COOKIE],
    ),
  )
}

export async function deleteProfile(req, res) {
  await deleteUserProfile(req.user.id)
  res.clearCookie(REFRESH_COOKIE, cookieOptions())
  res.status(204).end()
}
