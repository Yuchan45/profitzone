// Modelo de negocio: créditos. Es el espejo de profit-zone-back/src/config/plans.js:
// mantener los dos iguales (la API es la que valida y cobra; esto solo arma la pantalla).

export const RADIUS = { min: 100, max: 2000, step: 50, initial: 300 }

// Créditos gratis que se regalan al registrarse, por única vez (FREE_CREDITS_ON_SIGNUP en la API)
export const SIGNUP_FREE_CREDITS = 3

export const TIERS = {
  basic: {
    code: 'basic',
    name: 'Básico',
    creditKind: 'free',
    creditLabel: 'crédito gratis',
    radiusMax: 600,
    summary: 'Radio hasta 600 m, competencia de OpenStreetMap, reporte en pantalla y último reporte en el historial.',
    features: [
      'Radio de hasta 600 m',
      'Competencia: ubicación y cantidad de locales (OpenStreetMap)',
      'Densidad, demografía, alquileres (estadísticas) y afluencia estimada',
      'Reporte en pantalla',
      'Historial: solo el último',
    ],
  },
  complete: {
    code: 'complete',
    name: 'Completo',
    creditKind: 'paid',
    creditLabel: 'crédito pago',
    radiusMax: 2000,
    summary: 'Radio hasta 2 km, ratings de Google, listado de avisos de alquiler, PDF e historial completo.',
    features: [
      'Radio de hasta 2 km',
      'Competencia con ratings y reseñas de Google',
      'Listado detallado de avisos de alquiler',
      'Reporte en pantalla y en PDF',
      'Historial completo',
    ],
  },
}

export const TIER_LIST = [TIERS.basic, TIERS.complete]

/** Créditos del usuario del tipo que gasta el nivel (0 sin sesión). */
export function creditsFor(user, tierCode) {
  const credits = user?.credits
  if (!credits) return 0
  return TIERS[tierCode].creditKind === 'free' ? credits.free : credits.paid
}

/** Nivel con el que arranca la elección: el que el usuario puede pagar (básico sin sesión). */
export function defaultTier(user) {
  if (!user) return 'basic'
  if (creditsFor(user, 'basic') > 0) return 'basic'
  if (creditsFor(user, 'complete') > 0) return 'complete'
  return 'basic'
}

export function pluralCredits(count) {
  return count === 1 ? '1 crédito' : `${count} créditos`
}
