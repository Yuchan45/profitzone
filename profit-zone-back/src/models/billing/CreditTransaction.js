import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

/** Libro de movimientos de créditos: amount > 0 los ingresa y amount < 0 los gasta. */
export const CreditTransaction = sequelize.define(
  'CreditTransaction',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.STRING(4), allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(20), allowNull: false },
    analysisId: { type: DataTypes.UUID, allowNull: true },
    orderId: { type: DataTypes.UUID, allowNull: true },
  },
  // Solo se agregan filas: no se actualizan
  { schema: 'billing', tableName: 'credit_transactions', timestamps: true, updatedAt: false },
)
