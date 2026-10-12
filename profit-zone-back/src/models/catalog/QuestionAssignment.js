import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const ASSIGNMENT_SCOPES = ['global', 'category', 'subcategory']
export const ASSIGNMENT_SECTIONS = ['business', 'details']

/**
 * Qué pregunta aparece en qué rubro.
 * global → sin IDs; category → solo categoryId; subcategory → solo subcategoryId.
 * La DB lo garantiza con CK_question_assignments_scope.
 */
export const QuestionAssignment = sequelize.define(
  'QuestionAssignment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    scope: { type: DataTypes.STRING(12), allowNull: false, validate: { isIn: [ASSIGNMENT_SCOPES] } },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
    subcategoryId: { type: DataTypes.INTEGER, allowNull: true },
    // business = "Tu negocio"
    section: { type: DataTypes.STRING(10), allowNull: false, validate: { isIn: [ASSIGNMENT_SECTIONS] } },
    isRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { schema: 'catalog', tableName: 'question_assignments', timestamps: false },
)
