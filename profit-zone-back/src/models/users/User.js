import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const User = sequelize.define(
  'User',
  {
    // La columna no tiene default en la DB: el id se genera en la app.
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    email: { type: DataTypes.STRING(320), allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLoginAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    schema: 'users',
    tableName: 'users',
    timestamps: true,
    // Nunca devolver el hash por defecto: pedirlo explícitamente con scope('withPassword').
    defaultScope: { attributes: { exclude: ['passwordHash'] } },
    scopes: { withPassword: { attributes: { include: ['passwordHash'] } } },
  },
)

// El defaultScope solo cubre las búsquedas: create(), save() y reload() devuelven
// la instancia con el hash. toJSON lo quita siempre (res.json usa toJSON).
User.prototype.toJSON = function toJSON() {
  const { passwordHash, ...values } = this.get()
  return values
}
