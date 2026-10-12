import { Op, UniqueConstraintError } from 'sequelize'
import { sequelize } from '../db/sequelize.js'
import { AuthToken, Role, User } from '../models/index.js'
import { env } from '../config/env.js'
import { getDummyPasswordHash, hashPassword, verifyPassword } from '../utils/password.js'
import { generateOpaqueToken, hashToken, signAccessToken } from '../utils/tokens.js'

const REFRESH = 'refresh'
const DAY_MS = 24 * 60 * 60 * 1000

// Si un refresh token ya rotado vuelve a llegar dentro de este margen se toma
// como una carrera benigna (dos pestañas o requests en paralelo) y no como robo.
const ROTATION_GRACE_MS = 30 * 1000

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.'
const INVALID_SESSION = 'Tu sesión expiró. Iniciá sesión de nuevo.'

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

/** Borra los refresh tokens vencidos del usuario para que la tabla no crezca sin límite. */
async function cleanupExpiredTokens(userId) {
  await AuthToken.destroy({
    where: { userId, type: REFRESH, expiresAt: { [Op.lt]: new Date() } },
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
  await cleanupExpiredTokens(user.id)

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

export async function getMe(userId) {
  const user = await User.findByPk(userId, { include: [withRole] })
  if (!user || !user.isActive) throw httpError(401, INVALID_SESSION)
  return toUserDto(user)
}
