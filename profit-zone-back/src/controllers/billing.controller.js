import {
  createCheckout,
  getCreditsSummary,
  handleMercadoPagoWebhook,
  listOrders,
  listPacks,
  orderStatus,
  simulatePayment,
  syncOrder,
} from '../services/billing.service.js'
import { httpError } from '../utils/httpErrors.js'

export async function getPacks(req, res) {
  res.json(await listPacks())
}

export async function getMyCredits(req, res) {
  res.json(await getCreditsSummary(req.user.id))
}

export async function getMyOrders(req, res) {
  res.json(await listOrders(req.user.id))
}

export async function postCheckout(req, res) {
  const packCode = req.body?.packCode
  if (typeof packCode !== 'string' || packCode.trim() === '') {
    throw httpError(400, 'El campo "packCode" es obligatorio.')
  }
  res.status(201).json(await createCheckout(req.user, packCode.trim()))
}

export async function getOrder(req, res) {
  res.json(await orderStatus(req.user.id, req.params.id))
}

export async function postSyncOrder(req, res) {
  res.json(await syncOrder(req.user, req.params.id))
}

export async function postSimulatePayment(req, res) {
  res.json(await simulatePayment(req.user, req.params.id))
}

// Lo llama Mercado Pago: sin sesión. Responde 200 para lo que no importa y deja que reintente
// (un error 5xx) si no se pudo consultar el pago.
export async function postMercadoPagoWebhook(req, res) {
  res.json(await handleMercadoPagoWebhook({ query: req.query, body: req.body }))
}
