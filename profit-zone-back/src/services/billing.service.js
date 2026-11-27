import { QueryTypes } from 'sequelize'
import { sequelize } from '../db/sequelize.js'
import { env } from '../config/env.js'
import { CREDIT_PACKS, findPack } from '../config/plans.js'
import { Order, User } from '../models/index.js'
import { httpError } from '../utils/httpErrors.js'
import { addCredits, getCredits, listCreditTransactions } from './credits.service.js'
import { getUsdArsRate, usdToArs } from './fx.service.js'

const MP_API = 'https://api.mercadopago.com'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sameId(a, b) {
  // SQL Server devuelve los uniqueidentifier en mayúsculas
  return String(a).toLowerCase() === String(b).toLowerCase()
}

function toOrderDto(order) {
  return {
    id: order.id.toLowerCase(),
    packCode: order.packCode,
    credits: order.credits,
    amountUsd: Number(order.amountUsd),
    amountArs: Number(order.amountArs),
    usdArsRate: Number(order.usdArsRate),
    provider: order.provider,
    status: order.status,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  }
}

async function findOwnOrder(orderId, userId) {
  if (!UUID_PATTERN.test(orderId)) throw httpError(404, 'No existe la compra.')
  const order = await Order.findByPk(orderId)
  if (!order || !sameId(order.userId, userId)) throw httpError(404, 'No existe la compra.')
  return order
}

/** Los packs con su precio en dólares y en pesos al tipo de cambio de hoy. */
export async function listPacks() {
  const { rate, source } = await getUsdArsRate()
  const unitUsd = CREDIT_PACKS[0].priceUsd / CREDIT_PACKS[0].credits
  return {
    provider: env.billing.provider,
    usdArsRate: rate,
    rateSource: source,
    packs: CREDIT_PACKS.map((pack) => {
      const perCreditUsd = pack.priceUsd / pack.credits
      return {
        code: pack.code,
        credits: pack.credits,
        priceUsd: pack.priceUsd,
        priceArs: usdToArs(pack.priceUsd, rate),
        pricePerCreditUsd: Number(perCreditUsd.toFixed(2)),
        // Descuento por cantidad respecto del crédito suelto
        savingPercent: Math.round((1 - perCreditUsd / unitUsd) * 100),
      }
    }),
  }
}

/** Saldo y últimos movimientos del usuario. */
export async function getCreditsSummary(userId) {
  const [credits, transactions] = await Promise.all([getCredits(userId), listCreditTransactions(userId)])
  return { credits, transactions }
}

export async function listOrders(userId) {
  const orders = await Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 20 })
  return orders.map(toOrderDto)
}

/**
 * Acredita una compra una sola vez: el UPDATE condicional pasa la orden a 'paid' y solo quien
 * lo logra suma los créditos (el webhook y la vuelta del usuario pueden llegar a la vez).
 * Devuelve true si acreditó, false si ya estaba acreditada.
 */
async function creditOrder(orderId, providerPaymentId) {
  return sequelize.transaction(async (transaction) => {
    const rows = await sequelize.query(
      `UPDATE billing.orders
          SET status = 'paid', paid_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME(),
              provider_payment_id = :paymentId
       OUTPUT INSERTED.user_id AS userId, INSERTED.credits AS credits
        WHERE id = :orderId AND status <> 'paid'`,
      { replacements: { orderId, paymentId: providerPaymentId }, type: QueryTypes.SELECT, transaction },
    )
    if (rows.length === 0) return false
    const { userId, credits } = rows[0]
    await addCredits(userId, 'paid', credits, { reason: 'purchase', orderId, transaction })
    return true
  })
}

async function mercadoPago(path, { method = 'GET', body } = {}) {
  const token = env.billing.mercadoPagoAccessToken
  if (!token) throw httpError(503, 'El cobro con Mercado Pago no está configurado.', 'PAYMENTS_NOT_CONFIGURED')
  const response = await fetch(`${MP_API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('[ProfitZone] Mercado Pago respondió con error:', response.status, JSON.stringify(data))
    throw httpError(502, 'No pudimos comunicarnos con Mercado Pago. Probá de nuevo en un rato.')
  }
  return data
}

async function createMercadoPagoPreference(order, pack, user) {
  const base = env.frontendUrl.replace(/\/$/, '')
  const back = (result) => `${base}/creditos/resultado?compra=${order.id.toLowerCase()}&resultado=${result}`
  const body = {
    items: [
      {
        id: pack.code,
        title: `ProfitZone: ${pack.credits} ${pack.credits === 1 ? 'crédito' : 'créditos'} de análisis`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Number(order.amountArs),
      },
    ],
    external_reference: order.id.toLowerCase(),
    payer: { email: user.email },
    back_urls: { success: back('ok'), failure: back('error'), pending: back('pendiente') },
    auto_return: 'approved',
    statement_descriptor: 'PROFITZONE',
  }
  // Mercado Pago solo avisa por webhook a una URL pública con https
  if (base.startsWith('https://')) body.notification_url = `${base}/api/billing/webhook/mercadopago`

  const preference = await mercadoPago('/checkout/preferences', { method: 'POST', body })
  // Con credenciales de prueba (TEST-...) se usa el checkout de sandbox
  const sandbox = env.billing.mercadoPagoAccessToken.startsWith('TEST-')
  return { providerRef: preference.id, checkoutUrl: sandbox ? preference.sandbox_init_point : preference.init_point }
}

/**
 * Crea la compra de un pack y devuelve a dónde mandar al usuario a pagar.
 * - 'mock': checkout simulado de la propia app (demo: acredita sin cobrar).
 * - 'mercadopago': preferencia de pago en pesos al tipo de cambio del día.
 */
export async function createCheckout(user, packCode) {
  const pack = findPack(packCode)
  if (!pack) throw httpError(400, 'Elegí un pack de créditos válido.')

  const { rate } = await getUsdArsRate()
  const order = await Order.create({
    userId: user.id,
    packCode: pack.code,
    credits: pack.credits,
    amountUsd: pack.priceUsd,
    amountArs: usdToArs(pack.priceUsd, rate),
    usdArsRate: rate,
    provider: env.billing.provider,
    status: 'pending',
  })

  if (env.billing.provider === 'mock') {
    const base = env.frontendUrl.replace(/\/$/, '')
    return { order: toOrderDto(order), checkoutUrl: `${base}/creditos/simulado/${order.id.toLowerCase()}` }
  }

  const dbUser = await User.findByPk(user.id, { attributes: ['email'] })
  try {
    const { providerRef, checkoutUrl } = await createMercadoPagoPreference(order, pack, dbUser)
    await order.update({ providerRef })
    return { order: toOrderDto(order), checkoutUrl }
  } catch (error) {
    await order.update({ status: 'failed' })
    throw error
  }
}

/** Confirma una compra simulada (solo con PAYMENT_PROVIDER=mock): acredita los créditos. */
export async function simulatePayment(user, orderId) {
  if (env.billing.provider !== 'mock') {
    throw httpError(403, 'El pago simulado no está disponible.', 'MOCK_PAYMENTS_DISABLED')
  }
  const order = await findOwnOrder(orderId, user.id)
  if (order.provider !== 'mock') throw httpError(409, 'Esta compra no es una compra simulada.')
  await creditOrder(order.id, `mock-${Date.now()}`)
  return orderStatus(user.id, order.id)
}

/** Estado de una compra del usuario, con su saldo actual. */
export async function orderStatus(userId, orderId) {
  const order = await findOwnOrder(orderId, userId)
  return { order: toOrderDto(await order.reload()), credits: await getCredits(userId) }
}

/**
 * Consulta a Mercado Pago cómo quedó el pago de una compra y la acredita si está aprobado.
 * El usuario vuelve del checkout antes de que llegue el webhook: la pantalla de resultado llama
 * a esto para no depender de él.
 */
export async function syncOrder(user, orderId) {
  const order = await findOwnOrder(orderId, user.id)
  if (order.status === 'pending' && order.provider === 'mercadopago') {
    const search = await mercadoPago(
      `/v1/payments/search?external_reference=${order.id.toLowerCase()}&sort=date_created&criteria=desc`,
    )
    const payment = (search.results ?? [])[0]
    if (payment?.status === 'approved' && isPaymentForOrder(payment, order)) {
      await creditOrder(order.id, String(payment.id))
    } else if (payment && ['rejected', 'cancelled'].includes(payment.status)) {
      await order.update({ status: 'failed' })
    }
  }
  return orderStatus(user.id, order.id)
}

function isPaymentForOrder(payment, order) {
  // Que el pago aprobado sea por el importe en pesos de la orden (con un peso de tolerancia)
  return payment.currency_id === 'ARS' && Number(payment.transaction_amount) >= Number(order.amountArs) - 1
}

/**
 * Webhook de Mercado Pago. No se confía en lo que llega: con el id del pago se consulta la API
 * de Mercado Pago y recién ahí se acredita (de forma idempotente, ver creditOrder).
 */
export async function handleMercadoPagoWebhook({ query = {}, body = {} }) {
  const topic = body.type ?? query.type ?? query.topic
  const paymentId = body.data?.id ?? query['data.id'] ?? query.id
  if (topic !== 'payment' || !paymentId) return { ignored: true }

  const payment = await mercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`)
  const orderId = payment.external_reference
  if (payment.status !== 'approved' || !orderId || !UUID_PATTERN.test(orderId)) return { ignored: true }

  const order = await Order.findByPk(orderId)
  if (!order || !isPaymentForOrder(payment, order)) return { ignored: true }

  const credited = await creditOrder(order.id, String(payment.id))
  return { credited }
}
