import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const Role = sequelize.define(
  'Role',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // admin, free, premium
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(200), allowNull: true },
    // Rol de los usuarios nuevos. Como máximo uno (índice filtrado UQ_roles_is_default).
    isDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { schema: 'users', tableName: 'roles', timestamps: true, updatedAt: false },
)
