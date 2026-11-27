import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'

// CK_credit_transactions_kind y CK_credit_transactions_reason (migración 0016)
export const CREDIT_TRANSACTION_KINDS = ['free', 'paid']
export const CREDIT_TRANSACTION_REASONS = ['signup', 'purchase', 'analysis', 'upgrade', 'refund']

/** Libro de movimientos de créditos: amount > 0 los ingresa y amount < 0 los gasta. */
export const CreditTransaction = sequelize.define(
  'CreditTransaction',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    kind: { type: DataTypes.STRING(4), allowNull: false, validate: { isIn: [CREDIT_TRANSACTION_KINDS] } },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [CREDIT_TRANSACTION_REASONS] } },
    analysisId: { type: DataTypes.UUID, allowNull: true },
    orderId: { type: DataTypes.UUID, allowNull: true },
  },
  // Solo se agregan filas: no se actualizan
  { schema: 'billing', tableName: 'credit_transactions', timestamps: true, updatedAt: false },
)
