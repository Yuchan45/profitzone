import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const QuestionOption = sequelize.define(
  'QuestionOption',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    // up_to_500k, young, unknown (único dentro de su pregunta)
    code: { type: DataTypes.STRING(60), allowNull: false },
    label: { type: DataTypes.STRING(150), allowNull: false },
    // Rango (presupuesto, edad, superficie). valueMax NULL = sin tope.
    valueMin: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    valueMax: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    // Opción "No sé": el criterio queda not_evaluated
    isUnknown: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    // JSON con pistas para el motor. Se guarda como texto (CHECK ISJSON en la DB).
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('metadata')
        return raw == null ? null : JSON.parse(raw)
      },
      set(value) {
        this.setDataValue('metadata', value == null ? null : JSON.stringify(value))
      },
    },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { schema: 'catalog', tableName: 'question_options', timestamps: false },
)
