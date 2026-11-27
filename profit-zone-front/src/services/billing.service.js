import api from './api.js'

// Créditos y compras. Todo menos fetchPacks requiere sesión.

/** Packs de créditos con su precio en dólares y en pesos al tipo de cambio de hoy (público). */
export async function fetchPacks() {
  const { data } = await api.get('/billing/packs')
  return data
}

/** Saldo { credits: { free, paid, total } } y últimos movimientos del usuario. */
export async function fetchCreditsSummary() {
  const { data } = await api.get('/billing/credits')
  return data
}

/** Crea la compra de un pack y devuelve { order, checkoutUrl }: a dónde mandar a pagar. */
export async function createCheckout(packCode) {
  const { data } = await api.post('/billing/checkout', { packCode })
  return data
}

/** Estado de una compra con el saldo actual: { order, credits }. */
export async function fetchOrder(orderId) {
  const { data } = await api.get(`/billing/orders/${orderId}`)
  return data
}

/** Consulta a la pasarela cómo quedó el pago y acredita si está aprobado: { order, credits }. */
export async function syncOrder(orderId) {
  const { data } = await api.post(`/billing/orders/${orderId}/sync`)
  return data
}

/** Confirma una compra del checkout simulado (solo con la pasarela en modo demo). */
export async function simulatePayment(orderId) {
  const { data } = await api.post(`/billing/orders/${orderId}/simulate-pay`)
  return data
}
