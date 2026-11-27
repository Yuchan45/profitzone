import { Op, UniqueConstraintError } from 'sequelize'
import { sequelize } from '../db/sequelize.js'
import { Analysis, AuthToken, Role, User } from '../models/index.js'
import { httpError } from '../utils/httpErrors.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { hashToken } from '../utils/tokens.js'

const withRole = { model: Role, as: 'role', attributes: ['name'] }

function toProfileDto(user, activity) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role?.name ?? null,
    createdAt: user.createdAt,
    savedReportsCount: activity.savedReportsCount,
    lastAnalysisDate: activity.lastAnalysisDate,
  }
}

async function getActivitySummary(userId) {
  const savedReportsCount = await Analysis.count({ where: { userId, status: 'saved' } })
  const latest = await Analysis.findOne({
    where: { userId, status: 'saved' },
    attributes: ['updatedAt'],
    order: [['updatedAt', 'DESC']],
  })
  return {
    savedReportsCount,
    lastAnalysisDate: latest?.updatedAt ?? null,
  }
}

async function findActiveUser(userId, { withPassword = false } = {}) {
  const model = withPassword ? User.scope('withPassword') : User
  const user = await model.findByPk(userId, { include: [withRole] })
  if (!user || !user.isActive) {
    throw httpError(401, 'Tu sesión expiró. Iniciá sesión de nuevo.')
  }
  return user
}

export async function getProfile(userId) {
  const [user, activity] = await Promise.all([findActiveUser(userId), getActivitySummary(userId)])
  return toProfileDto(user, activity)
}

export async function updateProfile(userId, { firstName, lastName, email }) {
  const user = await findActiveUser(userId)
  try {
    await user.update({ firstName, lastName, email })
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw httpError(409, 'Ya existe una cuenta con ese correo.')
    }
    throw error
  }
  const activity = await getActivitySummary(userId)
  return toProfileDto(user, activity)
}

export async function updateProfilePassword(userId, { currentPassword, newPassword }, currentRefreshToken) {
  const user = await findActiveUser(userId, { withPassword: true })

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw httpError(400, 'La contraseña actual es incorrecta.')
  }

  const passwordHash = await hashPassword(newPassword)
  const whereOtherSessions = {
    userId,
    type: 'refresh',
    revokedAt: null,
    ...(currentRefreshToken ? { tokenHash: { [Op.ne]: hashToken(currentRefreshToken) } } : {}),
  }

  await sequelize.transaction(async (transaction) => {
    await User.update({ passwordHash }, { where: { id: userId }, transaction })
    await AuthToken.update({ revokedAt: new Date() }, { where: whereOtherSessions, transaction })
  })

  return { success: true, message: 'Contraseña actualizada con éxito.' }
}

export async function deleteProfile(userId) {
  await findActiveUser(userId)
  await sequelize.transaction(async (transaction) => {
    await Analysis.destroy({ where: { userId }, transaction })
    await User.destroy({ where: { id: userId }, transaction })
  })
}
