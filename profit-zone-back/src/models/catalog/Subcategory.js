import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const Subcategory = sequelize.define(
  'Subcategory',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    categoryId: { type: DataTypes.INTEGER, allowNull: false },
    // restaurante, cafeteria, gimnasio, pilates (único dentro de su categoría)
    code: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(300), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { schema: 'catalog', tableName: 'subcategories', timestamps: true },
)
