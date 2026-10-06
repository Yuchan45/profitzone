// Reglas del cuadro "Fortalezas y debilidades" del reporte (PZ-20).
// Cada criterio cruza una respuesta del paso 2 con un indicador de la zona y
// devuelve una lectura. Los umbrales son una primera propuesta: están acá para
// ajustarlos sin tocar la lógica.

// Lecturas posibles: strength | alert | weakness | neutral | not_evaluated

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

// Alquiler mensual (mediana de los avisos del radio) contra el tope del presupuesto
const RENT = {
  // Hasta este factor sobre el tope del presupuesto es alerta; más arriba, debilidad
  alertOverBudget: 1.25,
  // Con menos avisos que esto se aclara que la muestra es chica
  fewListings: 3,
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

// Criterio cuyo dato todavía no tiene fuente (no es un error de carga)
function noSourceCriterion(code, label, yourBusiness) {
  return criterion(code, label, yourBusiness, NO_DATA, 'not_evaluated', { noSource: true })
}

// El usuario respondió "no sé" o no definió el dato: no es una falla de la fuente
function undefinedAnswerCriterion(code, label, yourBusiness, zone) {
  return criterion(code, label, yourBusiness, zone, 'not_evaluated', { undefinedAnswer: true })
}

// Con "sin atención al público" los criterios que dependen del público que pasa no aplican
function notApplicableCriterion(code, label, yourBusiness) {
  return criterion(code, label, yourBusiness, NO_PUBLIC, 'not_evaluated', { notApplicable: true })
}

function formatInt(value) {
  return Math.round(value).toLocaleString('es-AR')
}

function formatArs(value) {
  return `$${formatInt(value)}`
}

/** Costo: tope del presupuesto vs. la mediana del alquiler mensual de los locales en oferta en el radio. */
export function costCriterion({ answerOption, answerLabel, rent }) {
  const yourBusiness = answerLabel('budget')
  const budget = answerOption('budget')
  const label = 'Costo'

  if (!budget || budget.isUnknown) {
    return undefinedAnswerCriterion('cost', label, yourBusiness, 'Sin presupuesto definido')
  }
  if (rent.status !== 'ok') {
    return criterion('cost', label, yourBusiness, 'No pudimos obtener el alquiler', 'not_evaluated')
  }

  // Solo cuentan los avisos con precio: son los que forman la mediana
  const { pricedInRadius, medianRentArs } = rent.data
  if (pricedInRadius === 0) {
    return criterion('cost', label, yourBusiness, 'Sin locales en alquiler publicados en el radio', 'not_evaluated')
  }

  const listings = pricedInRadius === 1 ? '1 aviso' : `${pricedInRadius} avisos`
  const sample = pricedInRadius < RENT.fewListings ? `, solo ${listings}` : ` (${listings})`
  const zone = `Alquiler mediano de ${formatArs(medianRentArs)}/mes${sample}`
  // "Más de $2M" no tiene tope: cualquier alquiler entra
  const budgetMax = budget.valueMax
  if (budgetMax === null || medianRentArs <= budgetMax) {
    return criterion('cost', label, yourBusiness, zone, 'strength')
  }
  const reading = medianRentArs > budgetMax * RENT.alertOverBudget ? 'weakness' : 'alert'
  return criterion('cost', label, yourBusiness, zone, reading)
}

/** Público: edades objetivo vs. demografía por edad. El censo cargado no trae edades. */
export function audienceCriterion({ answerLabel }) {
  return noSourceCriterion('audience', 'Público', answerLabel('target_age'))
}

/**
 * Horario: actividad típica del rubro en la franja del negocio. El servicio de
 * afluencia devuelve un perfil por rubro, no medido en el punto: se marca como estimado.
 */
export function scheduleCriterion({ answerLabel, trafficQuestion, traffic, noPublic }) {
  // Se muestra la respuesta con la que se pidió la afluencia
  const yourBusiness = trafficQuestion ? answerLabel(trafficQuestion) : answerLabel('schedule')
  if (noPublic) {
    return notApplicableCriterion('schedule', 'Horario', yourBusiness)
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
    return notApplicableCriterion('arrival', label, yourBusiness)
  }
  if (code === 'unknown' || code === null) {
    return undefinedAnswerCriterion('arrival', label, yourBusiness, 'Sin definir cómo llega tu cliente')
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
    return notApplicableCriterion('competition', 'Competencia', yourBusiness)
  }
  if (competition.status !== 'ok') {
    return criterion('competition', 'Competencia', yourBusiness, 'No pudimos obtener la competencia', 'not_evaluated')
  }

  const { total, directCount, averageRating, places = [] } = competition.data
  // Sin locales con rating el servicio devuelve un promedio por defecto: no se usa
  const hasRatings = places.some((place) => place.rating)
  // Si se llegó al máximo de resultados puede haber más locales que no vinieron
  const atLeast = total >= COMPETITION.maxResults ? 'Al menos ' : ''
  const ratingText = hasRatings ? `, rating promedio ${averageRating.toLocaleString('es-AR')}` : ''
  const zone =
    directCount === 0
      ? 'Sin competencia directa en el radio'
      : `${atLeast}${directCount} directos en el radio${ratingText}`
  let reading = 'strength'
  if (
    directCount >= COMPETITION.saturatedDirect ||
    (directCount >= COMPETITION.alertDirect && hasRatings && averageRating >= COMPETITION.strongRating)
  ) {
    reading = 'weakness'
  } else if (directCount >= COMPETITION.alertDirect) {
    reading = 'alert'
  }
  return criterion('competition', 'Competencia', yourBusiness, zone, reading)
}

/** Accesibilidad (subte, avenidas): todavía no hay fuente de datos. */
export function accessibilityCriterion({ answerLabel }) {
  return noSourceCriterion('accessibility', 'Accesibilidad', answerLabel('arrival_type'))
}

/** Lugares de interés según el público (ej. institutos educativos): sin fuente todavía. */
export function placesForAudienceCriterion({ answerLabel }) {
  return noSourceCriterion('places_for_audience', 'Según tu público', answerLabel('target_age'))
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

// good = fortaleza, alert = alerta, bad = debilidad
const SUMMARY_PHRASES = {
  cost: {
    good: 'un alquiler dentro de tu presupuesto',
    alert: 'un alquiler algo por encima de tu presupuesto',
    bad: 'un alquiler por encima de tu presupuesto',
  },
  audience: {
    good: 'buena presencia de tu público',
    alert: 'presencia media de tu público',
    bad: 'poca presencia de tu público',
  },
  arrival: {
    good: 'mucha gente viviendo cerca para el cliente de paso',
    alert: 'una cantidad media de gente viviendo cerca para el cliente de paso',
    bad: 'poca gente viviendo cerca para el cliente de paso',
  },
  competition: {
    good: 'poca competencia directa',
    alert: 'competencia directa moderada',
    bad: 'competencia directa alta',
  },
  accessibility: { good: 'buena accesibilidad', alert: 'accesibilidad regular', bad: 'accesibilidad limitada' },
  places_for_audience: {
    good: 'lugares cerca que atraen a tu público',
    alert: 'algunos lugares cerca que atraen a tu público',
    bad: 'pocos lugares cerca que atraigan a tu público',
  },
}

const READING_PHRASE = { weakness: 'bad', alert: 'alert' }

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
    .filter((c) => READING_PHRASE[c.reading])
    .map((c) => SUMMARY_PHRASES[c.code][READING_PHRASE[c.reading]])
  const schedule = criteria.find((c) => c.code === 'schedule' && c.estimated)
  const notApplicable = criteria.filter((c) => c.notApplicable).length
  const noSource = criteria.filter((c) => c.noSource).length
  const failed = criteria.filter(
    (c) => c.reading === 'not_evaluated' && !c.notApplicable && !c.noSource && !c.undefinedAnswer,
  ).length

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
  if (failed > 0) {
    sentences.push(
      failed === 1
        ? 'Un criterio no se pudo evaluar porque su dato no está disponible para este punto.'
        : `${failed} criterios no se pudieron evaluar porque sus datos no están disponibles para este punto.`,
    )
  }
  if (noSource > 0) {
    sentences.push(
      noSource === 1
        ? 'Un criterio todavía no tiene fuente de datos.'
        : `${noSource} criterios todavía no tienen fuente de datos.`,
    )
  }
  return sentences.join(' ')
}
