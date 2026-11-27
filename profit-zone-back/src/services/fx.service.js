import { env } from '../config/env.js'

// Cotización del dólar para cobrar los packs en pesos. Se cachea una hora; si la API falla se
// usa la última cotización conocida y, si no hay ninguna, USD_ARS_FALLBACK.
const TTL_MS = 60 * 60 * 1000
const RETRY_MS = 5 * 60 * 1000
const TIMEOUT_MS = 4000

let cache = null

async function fetchRate() {
  const response = await fetch(env.billing.fxApiUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  // dolarapi.com devuelve { compra, venta, ... }: se toma el de venta (lo que cuesta comprar dólares)
  const rate = Number(data.venta ?? data.rate ?? data.value)
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('respuesta sin cotización')
  return rate
}

/** Pesos por dólar: { rate, source: 'api' | 'fallback' }. */
export async function getUsdArsRate() {
  if (cache && Date.now() < cache.expiresAt) return { rate: cache.rate, source: cache.source }

  try {
    const rate = await fetchRate()
    cache = { rate, source: 'api', expiresAt: Date.now() + TTL_MS }
  } catch (error) {
    console.warn(`[ProfitZone] No se pudo obtener la cotización del dólar: ${error.message}`)
    cache = {
      rate: cache?.rate ?? env.billing.usdArsFallback,
      source: cache ? cache.source : 'fallback',
      // Reintenta pronto, sin pegarle a la API en cada request
      expiresAt: Date.now() + RETRY_MS,
    }
  }
  return { rate: cache.rate, source: cache.source }
}

/** Importe en pesos (entero, redondeado hacia arriba) de un precio en dólares. */
export function usdToArs(usd, rate) {
  return Math.ceil(usd * rate)
}
