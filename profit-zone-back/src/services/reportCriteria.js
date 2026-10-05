// Reglas del cuadro "Fortalezas y debilidades" del reporte (PZ-20).
// Cada criterio cruza una respuesta del paso 2 con un indicador de la zona y
// devuelve una lectura. Los umbrales son una primera propuesta: están acá para
// ajustarlos sin tocar la lógica.

export const READINGS = ['strength', 'alert', 'weakness', 'neutral', 'not_evaluated']

// Competencia directa dentro del radio
const COMPETITION = {
  // Google Places devuelve como máximo esta cantidad de locales por consulta
  maxResults: 20,
  // Desde esta cantidad de directos la zona está saturada
  saturatedDirect: 6,
  // Con al menos `alertDirect` directos y este rating promedio, la competencia es fuerte
  strongRating: 4.4,
  alertDirect: 3,
}

// Densidad (hab/km²) para negocios que dependen del cliente de paso
const DENSITY = {
  high: 10000,
  low: 4000,
}

// Score de afluencia (0–100) en la franja del negocio
const TRAFFIC = {
  high: 65,
  low: 40,
}

const NO_DATA = 'Sin datos para esta zona todavía'
const NO_PUBLIC = 'No aplica sin atención al público'

function criterion(code, label, yourBusiness, zone, reading, extra = {}) {
  return { code, label, yourBusiness, zone, reading, ...extra }
}

function formatInt(value) {
  return Math.round(value).toLocaleString('es-AR')
}

/** Costo: presupuesto vs. alquiler promedio. El alquiler todavía no tiene fuente (PZ-41). */
export function costCriterion({ answerLabel }) {
  return criterion('cost', 'Costo', answerLabel('budget'), NO_DATA, 'not_evaluated')
}

/** Público: edades objetivo vs. demografía por edad. El censo cargado no trae edades. */
export function audienceCriterion({ answerLabel }) {
  return criterion('audience', 'Público', answerLabel('target_age'), NO_DATA, 'not_evaluated')
}

/**
 * Horario: actividad típica del rubro en la franja del negocio. El servicio de
 * afluencia devuelve un perfil por rubro, no medido en el punto: se marca como estimado.
 */
export function scheduleCriterion({ answerLabel, traffic, noPublic }) {
  // La franja pico de la subcategoría es la que se usó para pedir la afluencia
  const yourBusiness =
    answerLabel('peak_slot_cafe') ?? answerLabel('peak_slot_fitness') ?? answerLabel('schedule')
  if (noPublic) {
    return criterion('schedule', 'Horario', yourBusiness, NO_PUBLIC, 'not_evaluated', {
      notApplicable: true,
    })
  }
  if (traffic.status !== 'ok') {
    return criterion('schedule', 'Horario', yourBusiness, 'No pudimos obtener la afluencia', 'not_evaluated')
  }

  const { score, timeSlot } = traffic.data
  const reading = score >= TRAFFIC.high ? 'strength' : score >= TRAFFIC.low ? 'neutral' : 'alert'
  return criterion(
    'schedule',
    'Horario',
    yourBusiness,
    `Afluencia típica del rubro de ${score}/100 (${timeSlot})`,
    reading,
    { estimated: true },
  )
}

/** Cómo llega el cliente: si depende del que pasa, importa cuánta gente vive cerca. */
export function arrivalCriterion({ answerCode, answerLabel, density, noPublic }) {
  const code = answerCode('arrival_type')
  const yourBusiness = answerLabel('arrival_type')
  const label = 'Cómo llega el cliente'

  if (noPublic) {
    return criterion('arrival', label, yourBusiness, NO_PUBLIC, 'not_evaluated', {
      notApplicable: true,
    })
  }
  if (code === 'unknown' || code === null) {
    return criterion('arrival', label, yourBusiness, 'Sin definir cómo llega tu cliente', 'not_evaluated')
  }
  if (density.status !== 'ok') {
    return criterion('arrival', label, yourBusiness, 'No pudimos obtener la densidad', 'not_evaluated')
  }
  if (!density.data.inCoverage) {
    return criterion('arrival', label, yourBusiness, 'Fuera de la cobertura del censo (CABA)', 'not_evaluated')
  }

  const perKm2 = density.data.densidadHabKm2
  const zone = `${formatInt(perKm2)} hab/km² en el radio`
  if (code === 'destination') {
    // El cliente viene a propósito: la densidad no define la ubicación
    return criterion('arrival', label, yourBusiness, zone, 'neutral')
  }
  const reading = perKm2 >= DENSITY.high ? 'strength' : perKm2 < DENSITY.low ? 'weakness' : 'alert'
  return criterion('arrival', label, yourBusiness, zone, reading)
}

/** Competencia: locales directos del rubro en el radio y qué tan bien valorados están. */
export function competitionCriterion({ answerLabel, subcategoryName, competition, noPublic }) {
  const priceLabel = answerLabel('price_level')
  const yourBusiness = priceLabel ? `${subcategoryName} · propuesta de precio: ${priceLabel}` : subcategoryName

  if (noPublic) {
    return criterion('competition', 'Competencia', yourBusiness, NO_PUBLIC, 'not_evaluated', {
      notApplicable: true,
    })
  }
  if (competition.status !== 'ok') {
    return criterion('competition', 'Competencia', yourBusiness, 'No pudimos obtener la competencia', 'not_evaluated')
  }

  const { total, directCount, averageRating } = competition.data
  // Si se llegó al máximo de resultados puede haber más locales que no vinieron
  const atLeast = total >= COMPETITION.maxResults ? 'Al menos ' : ''
  const zone =
    directCount === 0
      ? 'Sin competencia directa en el radio'
      : `${atLeast}${directCount} directos en el radio, rating promedio ${averageRating.toLocaleString('es-AR')}`
  let reading = 'strength'
  if (
    directCount >= COMPETITION.saturatedDirect ||
    (directCount >= COMPETITION.alertDirect && averageRating >= COMPETITION.strongRating)
  ) {
    reading = 'weakness'
  } else if (directCount >= COMPETITION.alertDirect) {
    reading = 'alert'
  }
  return criterion('competition', 'Competencia', yourBusiness, zone, reading)
}

/** Accesibilidad (subte, avenidas): todavía no hay fuente de datos. */
export function accessibilityCriterion({ answerLabel }) {
  return criterion('accessibility', 'Accesibilidad', answerLabel('arrival_type'), NO_DATA, 'not_evaluated')
}

/** Lugares de interés según el público (ej. institutos educativos): sin fuente todavía. */
export function placesForAudienceCriterion({ answerLabel }) {
  return criterion('places_for_audience', 'Según tu público', answerLabel('target_age'), NO_DATA, 'not_evaluated')
}

export const CRITERIA = [
  costCriterion,
  audienceCriterion,
  scheduleCriterion,
  arrivalCriterion,
  competitionCriterion,
  accessibilityCriterion,
  placesForAudienceCriterion,
]

const SUMMARY_PHRASES = {
  cost: { good: 'un alquiler dentro de tu presupuesto', bad: 'un alquiler por encima de tu presupuesto' },
  audience: { good: 'buena presencia de tu público', bad: 'poca presencia de tu público' },
  arrival: { good: 'mucha gente viviendo cerca para el cliente de paso', bad: 'poca gente viviendo cerca para el cliente de paso' },
  competition: { good: 'poca competencia directa', bad: 'competencia directa alta' },
  accessibility: { good: 'buena accesibilidad', bad: 'accesibilidad limitada' },
  places_for_audience: { good: 'lugares cerca que atraen a tu público', bad: 'pocos lugares cerca que atraigan a tu público' },
}

function joinPhrases(phrases) {
  if (phrases.length <= 1) return phrases.join('')
  return `${phrases.slice(0, -1).join(', ')} y ${phrases.at(-1)}`
}

/** Resumen en texto a partir de las lecturas: describe la zona, no recomienda abrir o no. */
export function buildSummary(criteria) {
  // Los criterios estimados no describen la zona: van en una oración aparte
  const zoneCriteria = criteria.filter((c) => !c.estimated)
  const good = zoneCriteria.filter((c) => c.reading === 'strength').map((c) => SUMMARY_PHRASES[c.code].good)
  const bad = zoneCriteria
    .filter((c) => c.reading === 'weakness' || c.reading === 'alert')
    .map((c) => SUMMARY_PHRASES[c.code].bad)
  const schedule = criteria.find((c) => c.code === 'schedule' && c.estimated)
  const notApplicable = criteria.filter((c) => c.notApplicable).length
  const notEvaluated = criteria.filter((c) => c.reading === 'not_evaluated' && !c.notApplicable).length

  const sentences = []
  if (good.length > 0) sentences.push(`La zona muestra ${joinPhrases(good)}.`)
  if (bad.length > 0) sentences.push(`Como puntos a considerar, hay ${joinPhrases(bad)}.`)
  if (good.length === 0 && bad.length === 0) {
    sentences.push('Con los datos disponibles no encontramos fortalezas ni debilidades marcadas en la zona.')
  }
  if (schedule?.reading === 'strength') {
    sentences.push('Tu franja coincide con el horario de más actividad típica del rubro (estimado).')
  } else if (schedule?.reading === 'alert') {
    sentences.push('Tu franja tiene poca actividad típica para el rubro (estimado).')
  }
  if (notApplicable > 0) {
    sentences.push('Como elegiste sin atención al público, no evaluamos competencia, horario ni cómo llega el cliente.')
  }
  if (notEvaluated > 0) {
    sentences.push(
      notEvaluated === 1
        ? 'Un criterio no se pudo evaluar por falta de datos.'
        : `${notEvaluated} criterios no se pudieron evaluar por falta de datos.`,
    )
  }
  return sentences.join(' ')
}
