// Modelo de negocio: freemium con créditos (ver docs/modelo-de-negocio.md).
// Un crédito gratis permite un análisis básico; un crédito pago, uno completo.

export const RADIUS_MIN_M = 100

export const TIERS = Object.freeze({
  basic: Object.freeze({
    code: 'basic',
    name: 'Básico',
    // Qué crédito consume
    creditKind: 'free',
    radiusMaxM: 600,
    // Competencia con ratings y reseñas de Google (el básico usa solo OpenStreetMap)
    googleRatings: false,
    // Listado detallado de avisos de alquiler (el básico muestra solo las estadísticas)
    rentalListings: false,
    // Descarga del reporte en PDF
    pdf: false,
    // Historial: el básico conserva solo el último reporte
    fullHistory: false,
  }),
  complete: Object.freeze({
    code: 'complete',
    name: 'Completo',
    creditKind: 'paid',
    radiusMaxM: 2000,
    googleRatings: true,
    rentalListings: true,
    pdf: true,
    fullHistory: true,
  }),
})

export const TIER_CODES = Object.keys(TIERS)
export const DEFAULT_TIER = 'basic'
export const RADIUS_MAX_M = Math.max(...Object.values(TIERS).map((tier) => tier.radiusMaxM))

/** Lo que incluye el nivel, tal como lo recibe el front. */
export function entitlementsOf(tierCode) {
  const tier = TIERS[tierCode]
  if (!tier) return null
  const { code, name, creditKind, radiusMaxM, googleRatings, rentalListings, pdf, fullHistory } = tier
  return { tier: code, name, creditKind, radiusMaxM, googleRatings, rentalListings, pdf, fullHistory }
}

// Packs de créditos pagos. El precio es en dólares de referencia: se cobra en pesos al tipo de
// cambio del día. Son precios propuestos para validar. Los créditos no vencen.
export const CREDIT_PACKS = Object.freeze([
  Object.freeze({ code: 'pack-1', credits: 1, priceUsd: 3 }),
  Object.freeze({ code: 'pack-5', credits: 5, priceUsd: 12 }),
  Object.freeze({ code: 'pack-15', credits: 15, priceUsd: 30 }),
])

export function findPack(code) {
  return CREDIT_PACKS.find((pack) => pack.code === code) ?? null
}
