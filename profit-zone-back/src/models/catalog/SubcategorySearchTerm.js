import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const SEARCH_TERM_TYPES = ['type', 'keyword']

/** Cómo se busca la competencia de cada subcategoría en Google Places. */
export const SubcategorySearchTerm = sequelize.define(
  'SubcategorySearchTerm',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subcategoryId: { type: DataTypes.INTEGER, allowNull: false },
    termType: { type: DataTypes.STRING(10), allowNull: false, validate: { isIn: [SEARCH_TERM_TYPES] } },
    // restaurant, cafe, gym, pilates
    termValue: { type: DataTypes.STRING(100), allowNull: false },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { schema: 'catalog', tableName: 'subcategory_search_terms', timestamps: false },
)
