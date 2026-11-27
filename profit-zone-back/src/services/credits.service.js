import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/sequelize.js'
import { env } from '../config/env.js'
import { CreditTransaction, User } from '../models/index.js'
import { httpError } from '../utils/httpErrors.js'

// Los créditos viven en dos columnas de users.users. Siempre se modifican con un UPDATE atómico
// (nunca "leer, sumar y guardar") y dentro de una transacción, junto con su fila en el libro
// billing.credit_transactions: así el saldo no puede quedar negativo ni duplicarse.
const COLUMN = { free: 'free_credits', paid: 'paid_credits' }

export const CREDIT_KINDS = Object.keys(COLUMN)

const INSUFFICIENT = {
  free: 'No te quedan créditos gratis. Para un análisis completo necesitás un crédito pago.',
  paid: 'Necesitás un crédito para el análisis completo. Comprá un pack de créditos.',
}

function toCredits({ freeCredits, paidCredits }) {
  return { free: freeCredits, paid: paidCredits, total: freeCredits + paidCredits }
}

/** Saldo del usuario: { free, paid, total }. */
export async function getCredits(userId, { transaction } = {}) {
  const user = await User.findByPk(userId, { attributes: ['freeCredits', 'paidCredits'], transaction })
  if (!user) throw httpError(404, 'No existe el usuario.')
  return toCredits(user)
}

/** Campos del usuario nuevo con el regalo de bienvenida (por única vez, al registrarse). */
export function signupGrantFields() {
  const amount = env.billing.freeCreditsOnSignup
  return amount > 0 ? { freeCredits: amount, freeCreditsGrantedAt: new Date() } : {}
}

/** Deja en el libro el regalo de bienvenida del usuario recién creado. */
export async function recordSignupGrant(userId, transaction) {
  const amount = env.billing.freeCreditsOnSignup
  if (amount <= 0) return
  await CreditTransaction.create({ userId, kind: 'free', amount, reason: 'signup' }, { transaction })
}

/**
 * Gasta 1 crédito del tipo indicado. Lanza 402 (INSUFFICIENT_CREDITS) si no hay saldo.
 * Tiene que llamarse dentro de una transacción.
 */
export async function spendCredit(userId, kind, { reason, analysisId = null, transaction }) {
  const column = COLUMN[kind]
  const rows = await sequelize.query(
    `UPDATE users.users
        SET ${column} = ${column} - 1, updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.free_credits AS freeCredits, INSERTED.paid_credits AS paidCredits
      WHERE id = :userId AND ${column} >= 1`,
    { replacements: { userId }, type: QueryTypes.SELECT, transaction },
  )
  if (rows.length === 0) throw httpError(402, INSUFFICIENT[kind], 'INSUFFICIENT_CREDITS')

  await CreditTransaction.create({ userId, kind, amount: -1, reason, analysisId }, { transaction })
  return toCredits(rows[0])
}

/** Suma `amount` créditos del tipo indicado (compra o devolución). Dentro de una transacción. */
export async function addCredits(userId, kind, amount, { reason, orderId = null, analysisId = null, transaction }) {
  const column = COLUMN[kind]
  const rows = await sequelize.query(
    `UPDATE users.users
        SET ${column} = ${column} + :amount, updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.free_credits AS freeCredits, INSERTED.paid_credits AS paidCredits
      WHERE id = :userId`,
    { replacements: { userId, amount }, type: QueryTypes.SELECT, transaction },
  )
  if (rows.length === 0) throw httpError(404, 'No existe el usuario.')

  await CreditTransaction.create({ userId, kind, amount, reason, orderId, analysisId }, { transaction })
  return toCredits(rows[0])
}

/** Últimos movimientos de créditos del usuario, del más reciente al más viejo. */
export async function listCreditTransactions(userId, limit = 50) {
  const rows = await CreditTransaction.findAll({
    where: { userId },
    order: [['id', 'DESC']],
    limit,
  })
  return rows.map((row) => ({
    id: Number(row.id),
    kind: row.kind,
    amount: row.amount,
    reason: row.reason,
    analysisId: row.analysisId ? row.analysisId.toLowerCase() : null,
    createdAt: row.createdAt,
  }))
}
