import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // gastronomia, fitness
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    // Texto de la card
    description: { type: DataTypes.STRING(300), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { schema: 'catalog', tableName: 'categories', timestamps: true },
)
