import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'
import { sequentialUuidPk } from '../shared.js'

export const ANALYSIS_STATUSES = ['draft', 'saved']

/** Versión parcial: faltan zona, indicadores y conclusiones. */
export const Analysis = sequelize.define(
  'Analysis',
  {
    id: sequentialUuidPk,
    // El análisis se crea con sesión: siempre tiene dueño
    userId: { type: DataTypes.UUID, allowNull: false },
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
    // Nombre que le pone el usuario: NULL hasta que lo renombra (se muestra el rubro)
    name: { type: DataTypes.STRING(80), allowNull: true },
    // Dirección del punto, buscada al analizar la zona. NULL si no hay una cerca o si falló
    address: { type: DataTypes.STRING(255), allowNull: true },
    // Nivel del análisis ('basic' | 'complete'), definido al analizar la zona; NULL en borradores
    tier: { type: DataTypes.STRING(10), allowNull: true, validate: { isIn: [['basic', 'complete']] } },
    // Crédito que se gastó ('free' | 'paid'); NULL si no se cobró (ej. cuenta admin)
    chargedCredit: { type: DataTypes.STRING(4), allowNull: true },
    chargedAt: { type: DataTypes.DATE, allowNull: true },
    // Si se mejoró de básico a completo, cuándo (para poder volver atrás si el reporte falla)
    upgradedAt: { type: DataTypes.DATE, allowNull: true },
    // Cuándo se generó bien el reporte del nivel actual: NULL = el cobro todavía se puede devolver
    reportGeneratedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { schema: 'analysis', tableName: 'analyses', timestamps: true },
)
