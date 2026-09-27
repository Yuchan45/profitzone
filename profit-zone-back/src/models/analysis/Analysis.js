import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'
import { sequentialUuidPk } from '../shared.js'

export const ANALYSIS_STATUSES = ['draft', 'saved']

/** Versión parcial: faltan zona, punto, radio, indicadores y conclusiones. */
export const Analysis = sequelize.define(
  'Analysis',
  {
    id: sequentialUuidPk,
    // Pendiente: NOT NULL si se exige login para analizar
    userId: { type: DataTypes.UUID, allowNull: true },
    // La categoría se obtiene desde la subcategoría
    subcategoryId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'draft',
      validate: { isIn: [ANALYSIS_STATUSES] },
    },
  },
  { schema: 'analysis', tableName: 'analyses', timestamps: true },
)
