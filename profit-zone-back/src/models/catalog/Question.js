import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const QUESTION_INPUT_TYPES = ['single_choice', 'multi_choice']

/** Banco de preguntas. Una pregunta usada no se edita: se desactiva y se crea otra. */
export const Question = sequelize.define(
  'Question',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // budget, target_age, price_level
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    prompt: { type: DataTypes.STRING(200), allowNull: false },
    helpText: { type: DataTypes.STRING(300), allowNull: true },
    inputType: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [QUESTION_INPUT_TYPES] } },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { schema: 'catalog', tableName: 'questions', timestamps: true },
)
