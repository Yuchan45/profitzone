import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'
import { sequentialUuidPk } from '../shared.js'

export const AUTH_TOKEN_TYPES = ['refresh', 'reset_password', 'verify_email']

export const AuthToken = sequelize.define(
  'AuthToken',
  {
    id: sequentialUuidPk,
    userId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [AUTH_TOKEN_TYPES] } },
    // SHA-256 en hex. Nunca guardar el token en claro.
    tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    // Tokens de un solo uso (reset, verify)
    usedAt: { type: DataTypes.DATE, allowNull: true },
    // Logout o rotación de refresh token
    revokedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { schema: 'users', tableName: 'auth_tokens', timestamps: true, updatedAt: false },
)
