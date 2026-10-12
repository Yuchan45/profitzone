import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

export const IMPLICIT_RULE_EFFECTS = ['card', 'conclusion', 'both']

/**
 * Reglas implícitas según las respuestas (ej.: si tenés un kiosco, buscar
 * colegios cerca). Diferible: las 2 reglas iniciales pueden ser constantes en código.
 */
export const ImplicitRule = sequelize.define(
  'ImplicitRule',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    // Respuesta que dispara la regla
    optionId: { type: DataTypes.INTEGER, allowNull: false },
    // school, university
    featureType: { type: DataTypes.STRING(30), allowNull: false },
    effect: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [IMPLICIT_RULE_EFFECTS] } },
    messageTemplate: { type: DataTypes.STRING(300), allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { schema: 'catalog', tableName: 'implicit_rules', timestamps: false },
)
