import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

/**
 * Una fila por opción elegida: una pregunta múltiple genera varias filas.
 * Debe venir optionId, valueNumber o valueText (CK_analysis_answers_value).
 */
export const AnalysisAnswer = sequelize.define(
  'AnalysisAnswer',
  {
    // bigint: Sequelize lo devuelve como string para no perder precisión.
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    analysisId: { type: DataTypes.UUID, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    // NULL si la respuesta es un valor libre
    optionId: { type: DataTypes.INTEGER, allowNull: true },
    // A futuro
    valueNumber: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    valueText: { type: DataTypes.STRING(500), allowNull: true },
  },
  { schema: 'analysis', tableName: 'analysis_answers', timestamps: true, updatedAt: false },
)
