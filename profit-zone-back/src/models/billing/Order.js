import { DataTypes } from 'sequelize'
import { sequelize } from '../../db/sequelize.js'
import { sequentialUuidPk } from '../shared.js'

export const ORDER_STATUSES = ['pending', 'paid', 'failed']

/** Compra de un pack de créditos. Se acredita una sola vez, cuando pasa a 'paid'. */
export const Order = sequelize.define(
  'Order',
  {
    id: sequentialUuidPk,
    userId: { type: DataTypes.UUID, allowNull: false },
    packCode: { type: DataTypes.STRING(20), allowNull: false },
    credits: { type: DataTypes.INTEGER, allowNull: false },
    // decimal: Sequelize los devuelve como string
    amountUsd: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    amountArs: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    usdArsRate: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
    provider: { type: DataTypes.STRING(20), allowNull: false },
    // Id de la preferencia de pago en la pasarela
    providerRef: { type: DataTypes.STRING(120), allowNull: true },
    providerPaymentId: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'pending' },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  { schema: 'billing', tableName: 'orders', timestamps: true },
)
