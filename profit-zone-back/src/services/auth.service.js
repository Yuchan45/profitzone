import { Op, QueryTypes, UniqueConstraintError } from 'sequelize'
import { sequelize } from '../db/sequelize.js'
import { AuthToken, Role, User } from '../models/index.js'
import { env } from '../config/env.js'
import { getDummyPasswordHash, hashPassword, verifyPassword } from '../utils/password.js'
import { generateOpaqueToken, hashToken, signAccessToken } from '../utils/tokens.js'
import { sendMail } from './mail.service.js'

const REFRESH = 'refresh'
const RESET_PASSWORD = 'reset_password'
const DAY_MS = 24 * 60 * 60 * 1000
const RESET_PASSWORD_TTL_MS = 30 * 60 * 1000

// Si un refresh token ya rotado vuelve a llegar dentro de este margen se toma
// como una carrera benigna (dos pestañas o requests en paralelo) y no como robo.
const ROTATION_GRACE_MS = 30 * 1000

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.'
const INVALID_SESSION = 'Tu sesión expiró. Iniciá sesión de nuevo.'
const INVALID_RESET_LINK = 'El link para restablecer la contraseña venció o ya se usó. Pedí uno nuevo.'

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function toUserDto(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role?.name ?? null,
    createdAt: user.createdAt,
  }
}

const withRole = { model: Role, as: 'role', attributes: ['name'] }

/** Crea el refresh token en la DB y arma la respuesta de sesión. */
async function issueSession(user, meta, transaction) {
  const refreshToken = generateOpaqueToken()
  const record = await AuthToken.create(
    {
      userId: user.id,
      type: REFRESH,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.auth.refreshTokenTtlDays * DAY_MS),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    },
    { transaction },
  )

  const dto = toUserDto(user)
  return {
    user: dto,
    accessToken: signAccessToken(dto),
    refreshToken,
    refreshTokenId: record.id,
  }
}

/** Revoca todos los refresh tokens activos del usuario (logout global o reuso detectado). */
async function revokeAllRefreshTokens(userId, transaction) {
  await AuthToken.update(
    { revokedAt: new Date() },
    { where: { userId, type: REFRESH, revokedAt: null }, transaction },
  )
}

/** Borra los tokens vencidos del usuario (de un tipo) para que la tabla no crezca sin límite. */
async function cleanupExpiredTokens(userId, type, transaction) {
  await AuthToken.destroy({
    where: { userId, type, expiresAt: { [Op.lt]: new Date() } },
    transaction,
  })
}

export async function register({ firstName, lastName, email, password }, meta) {
  const defaultRole = await Role.findOne({ where: { isDefault: true } })
  if (!defaultRole) {
    // Falta correr el seed (npm run db:seed:catalog)
    throw httpError(500, 'No hay un rol por defecto configurado para usuarios nuevos.')
  }

  const passwordHash = await hashPassword(password)

  try {
    return await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        { firstName, lastName, email, passwordHash, roleId: defaultRole.id, lastLoginAt: new Date() },
        { transaction },
      )
      user.role = defaultRole
      return issueSession(user, meta, transaction)
    })
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw httpError(409, 'Ya existe una cuenta con ese correo.')
    }
    throw error
  }
}

export async function login({ email, password }, meta) {
  const user = await User.scope('withPassword').findOne({ where: { email }, include: [withRole] })

  if (!user) {
    // Mismo costo que una contraseña real: no revela si el correo existe
    await verifyPassword(password, await getDummyPasswordHash())
    throw httpError(401, INVALID_CREDENTIALS)
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    throw httpError(401, INVALID_CREDENTIALS)
  }

  if (!user.isActive) {
    throw httpError(403, 'Tu cuenta está desactivada.')
  }

  user.lastLoginAt = new Date()
  await user.save({ fields: ['lastLoginAt'] })
  await cleanupExpiredTokens(user.id, REFRESH)

  return issueSession(user, meta)
}

/**
 * Rota el refresh token: revoca el actual y emite uno nuevo.
 * Si llega un token ya rotado (fuera del margen de gracia) se asume robo y se
 * revocan todas las sesiones del usuario.
 */
export async function refresh(refreshToken, meta) {
  if (!refreshToken) throw httpError(401, INVALID_SESSION)

  const record = await AuthToken.findOne({
    where: { tokenHash: hashToken(refreshToken), type: REFRESH },
    include: [{ model: User, as: 'user', include: [withRole] }],
  })

  if (!record) throw httpError(401, INVALID_SESSION)

  if (record.revokedAt) {
    const rotatedRecently =
      record.replacedById && Date.now() - new Date(record.revokedAt).getTime() < ROTATION_GRACE_MS
    if (!rotatedRecently) {
      console.warn(`[ProfitZone] Reuso de refresh token detectado: se revocan las sesiones del usuario ${record.userId}`)
      await revokeAllRefreshTokens(record.userId)
    }
    throw httpError(401, INVALID_SESSION)
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw httpError(401, INVALID_SESSION)
  }

  if (!record.user?.isActive) {
    await revokeAllRefreshTokens(record.userId)
    throw httpError(401, INVALID_SESSION)
  }

  return sequelize.transaction(async (transaction) => {
    const session = await issueSession(record.user, meta, transaction)

    // Revocación atómica: si otra request ya lo rotó, no se emiten dos sesiones
    const [updated] = await AuthToken.update(
      { revokedAt: new Date(), replacedById: session.refreshTokenId },
      { where: { id: record.id, revokedAt: null }, transaction },
    )
    if (updated !== 1) throw httpError(401, INVALID_SESSION)

    return session
  })
}

/** Revoca el refresh token actual. Idempotente: sin token o ya revocado no falla. */
export async function logout(refreshToken) {
  if (!refreshToken) return
  await AuthToken.update(
    { revokedAt: new Date() },
    { where: { tokenHash: hashToken(refreshToken), type: REFRESH, revokedAt: null } },
  )
}

function buildResetPasswordMail(user, link) {
  const minutes = RESET_PASSWORD_TTL_MS / 60000
  const text = [
    `Hola, ${user.firstName}:`,
    '',
    'Recibimos un pedido para restablecer la contraseña de tu cuenta de ProfitZone.',
    `Entrá a este link para elegir una nueva (vence en ${minutes} minutos y sirve una sola vez):`,
    link,
    '',
    'Si no lo pediste, ignorá este correo: tu contraseña sigue siendo la misma.',
  ].join('\n')
  const html = `
    <p>Hola, ${escapeHtml(user.firstName)}:</p>
    <p>Recibimos un pedido para restablecer la contraseña de tu cuenta de ProfitZone.</p>
    <p><a href="${link}">Elegí una contraseña nueva</a>. El link vence en ${minutes} minutos y sirve una sola vez.</p>
    <p>Si no lo pediste, ignorá este correo: tu contraseña sigue siendo la misma.</p>
  `
  return { to: user.email, subject: 'Restablecé tu contraseña de ProfitZone', text, html }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

/**
 * Bloquea la fila del usuario hasta el fin de la transacción. Los flujos de
 * recuperación la toman primero, siempre en el mismo orden, para no trabarse
 * entre sí (deadlock) al tocar después sus tokens.
 */
async function lockUserRow(userId, transaction) {
  await sequelize.query('SELECT id FROM users.users WITH (UPDLOCK, ROWLOCK) WHERE id = :id', {
    replacements: { id: userId },
    type: QueryTypes.SELECT,
    transaction,
  })
}

/** Invalida los links anteriores, crea uno nuevo y manda el correo. */
async function issuePasswordReset(email, meta) {
  const user = await User.findOne({ where: { email } })
  if (!user || !user.isActive) return

  const token = generateOpaqueToken()
  await sequelize.transaction(async (transaction) => {
    // Dos pedidos a la vez se ejecutan uno detrás del otro y no dejan dos links
    // válidos (con READ COMMITTED la transacción sola no alcanza)
    await lockUserRow(user.id, transaction)
    await cleanupExpiredTokens(user.id, RESET_PASSWORD, transaction)
    // Solo el último link pedido sirve
    await AuthToken.update(
      { revokedAt: new Date() },
      { where: { userId: user.id, type: RESET_PASSWORD, usedAt: null, revokedAt: null }, transaction },
    )
    await AuthToken.create(
      {
        userId: user.id,
        type: RESET_PASSWORD,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_PASSWORD_TTL_MS),
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
      },
      { transaction },
    )
  })

  const link = `${env.frontendUrl}/restablecer-contrasena?token=${encodeURIComponent(token)}`
  await sendMail(buildResetPasswordMail(user, link))
}

/**
 * Pide restablecer la contraseña: si el correo es de una cuenta activa, invalida
 * los links anteriores y manda uno nuevo. No espera a que termine: la respuesta
 * tarda lo mismo exista o no el correo, así no revela qué cuentas hay.
 */
export function requestPasswordReset(email, meta) {
  issuePasswordReset(email, meta).catch((error) => {
    // Sin await en el controller: este log es el único rastro si falla la DB o el SMTP.
    // Solo nombre, código y mensaje: el error entero trae el SQL con sus parámetros o el correo
    console.error(
      `[ProfitZone] No se pudo procesar el pedido de recuperación de contraseña: ${error.name}${
        error.code ? ` (${error.code})` : ''
      }: ${error.message}`,
    )
  })
}

/**
 * Cambia la contraseña con un link de recuperación. El token es de un solo uso
 * y, al usarlo, se cierran todas las sesiones abiertas de la cuenta.
 */
export async function resetPassword(token, password) {
  if (!token) throw httpError(400, INVALID_RESET_LINK)

  const record = await AuthToken.findOne({
    where: { tokenHash: hashToken(token), type: RESET_PASSWORD },
    include: [{ model: User, as: 'user' }],
  })

  const expired = record && new Date(record.expiresAt).getTime() <= Date.now()
  if (!record || record.usedAt || record.revokedAt || expired || !record.user?.isActive) {
    throw httpError(400, INVALID_RESET_LINK)
  }

  const passwordHash = await hashPassword(password)

  await sequelize.transaction(async (transaction) => {
    await lockUserRow(record.userId, transaction)
    // Uso atómico: dos requests con el mismo link no cambian la contraseña dos veces
    const [updated] = await AuthToken.update(
      { usedAt: new Date() },
      { where: { id: record.id, usedAt: null, revokedAt: null }, transaction },
    )
    if (updated !== 1) throw httpError(400, INVALID_RESET_LINK)

    await User.update({ passwordHash }, { where: { id: record.userId }, transaction })
    await revokeAllRefreshTokens(record.userId, transaction)
  })
}

export async function getMe(userId) {
  const user = await User.findByPk(userId, { include: [withRole] })
  if (!user || !user.isActive) throw httpError(401, INVALID_SESSION)
  return toUserDto(user)
}
