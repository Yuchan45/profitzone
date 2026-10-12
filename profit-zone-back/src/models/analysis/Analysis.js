import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'
import { sequentialUuidPk } from '../shared.js'

export const ANALYSIS_STATUSES = ['draft', 'saved']

/** Versión parcial: faltan zona, indicadores y conclusiones. */
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
    // Ubicación elegida en el paso 3: NULL hasta entonces, y van los tres juntos
    // (CK_analyses_location). decimal: Sequelize los devuelve como string.
    centerLat: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
    centerLng: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
    radiusM: { type: DataTypes.INTEGER, allowNull: true },
  },
  { schema: 'analysis', tableName: 'analyses', timestamps: true },
)
