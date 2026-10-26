import { calculateMedian } from '../utils/stats.js'

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
  // Con menos avisos que esto la muestra es chica: se aclara y la lectura queda neutral.
  // También es el mínimo de avisos del tamaño respondido para comparar solo contra esos.
  fewListings: 3,
  // Preguntas de superficie (m²) del catálogo, según el rubro
  surfaceQuestions: ['surface_gym', 'surface_pilates'],
}

// Score de afluencia (0–100) en la franja del negocio
const TRAFFIC = {
  high: 65,
  low: 40,
}

// Público objetivo por edad en el radio (participación de referencia CABA por grupo)
const AUDIENCE = {
  expectedShareByGroup: {
    kids: 14,
    young: 30,
    adults: 34,
    seniors: 22,
  },
  strengthRatio: 0.95,
  weaknessRatio: 0.75,
  minStrengthCount: 1500,
  minAlertCount: 500,
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

/** Opción de superficie respondida (solo algunos rubros la preguntan) o null. */
function surfaceAnswer(answerOption) {
  for (const code of RENT.surfaceQuestions) {
    const option = answerOption(code)
    if (option && !option.isUnknown) return option
  }
  return null
}

function inRange(value, { valueMin, valueMax }) {
  return value >= (valueMin ?? 0) && (valueMax === null || valueMax === undefined || value <= valueMax)
}

/**
 * Avisos con precio contra los que se compara el presupuesto. Si el rubro
 * pregunta la superficie y hay suficientes avisos de ese tamaño, solo esos.
 */
function comparableListings(places, surface) {
  const priced = places.filter((p) => p.monthlyRentArs)
  if (!surface) return { listings: priced, bySurface: false }
  const sized = priced.filter((p) => p.surfaceM2 && inRange(p.surfaceM2, surface))
  return sized.length >= RENT.fewListings
    ? { listings: sized, bySurface: true }
    : { listings: priced, bySurface: false }
}

/**
 * Costo: tope del presupuesto vs. la mediana del alquiler mensual de los locales
 * en oferta en el radio (del tamaño que necesita, si el rubro pregunta la superficie).
 */
export function costCriterion({ answerOption, answerLabel, rent }) {
  const budget = answerOption('budget')
  const surface = surfaceAnswer(answerOption)
  const yourBusiness = [answerLabel('budget'), surface?.label].filter(Boolean).join(', ') || null
  const label = 'Costo'

  if (!budget || budget.isUnknown) {
    return undefinedAnswerCriterion('cost', label, yourBusiness, 'Sin presupuesto definido')
  }
  if (rent.status !== 'ok') {
    return criterion('cost', label, yourBusiness, 'No pudimos obtener el alquiler', 'not_evaluated')
  }

  const { totalInRadius, places = [] } = rent.data
  if (totalInRadius === 0) {
    return criterion('cost', label, yourBusiness, 'Sin locales en alquiler publicados en el radio', 'not_evaluated')
  }

  // Solo cuentan los avisos con precio: son los que forman la mediana
  const { listings, bySurface } = comparableListings(places, surface)
  if (listings.length === 0) {
    const published = totalInRadius === 1 ? 'Hay 1 local publicado' : `Hay ${totalInRadius} locales publicados`
    return criterion('cost', label, yourBusiness, `${published} en el radio, pero sin precio`, 'not_evaluated')
  }

  const rentArs = calculateMedian(listings.map((p) => p.monthlyRentArs))
  const count = listings.length === 1 ? '1 aviso' : `${listings.length} avisos`
  const sample = listings.length < RENT.fewListings ? `solo ${count}` : count
  // Con superficie pero pocos avisos de ese tamaño se muestra la mediana de todos
  // los tamaños como referencia, se aclara y la lectura queda neutral
  const surfaceText = surface && `${surface.label.charAt(0).toLowerCase()}${surface.label.slice(1)}`
  const scope = bySurface
    ? `de locales de ${surfaceText} en el radio`
    : surface
      ? `en el radio, de cualquier tamaño (hay pocos avisos de ${surfaceText} para comparar)`
      : 'en el radio'
  const zone = `Alquiler mediano de ${formatArs(rentArs)}/mes ${scope} (${sample})`

  // Con muy pocos avisos la mediana no alcanza para una lectura firme. Tampoco si
  // el rubro pide una superficie y no hay suficientes avisos de ese tamaño: la
  // mediana de todos los tamaños no dice cuánto cuesta el local que necesita.
  if (listings.length < RENT.fewListings || (surface && !bySurface)) {
    return criterion('cost', label, yourBusiness, zone, 'neutral')
  }

  // "Más de $2M" no tiene tope: solo se sabe que entra si el alquiler no pasa el piso
  const budgetMax = budget.valueMax
  if (budgetMax === null || budgetMax === undefined) {
    const reading = rentArs <= (budget.valueMin ?? 0) ? 'strength' : 'neutral'
    return criterion('cost', label, yourBusiness, zone, reading)
  }
  if (rentArs <= budgetMax) return criterion('cost', label, yourBusiness, zone, 'strength')
  const reading = rentArs > budgetMax * RENT.alertOverBudget ? 'weakness' : 'alert'
  return criterion('cost', label, yourBusiness, zone, reading)
}

/** Público: edades objetivo vs. demografía por edad y sexo en el radio censal. */
export function audienceCriterion({ answerCodes, answerLabel, density }) {
  const yourBusiness = answerLabel('target_age')
  const selectedCodes = answerCodes ? answerCodes('target_age') : []
  const label = 'Público'

  if (selectedCodes.length === 0) {
    return undefinedAnswerCriterion('audience', label, yourBusiness, 'Sin público objetivo definido')
  }
  if (density.status !== 'ok') {
    return criterion('audience', label, yourBusiness, 'No pudimos obtener la demografía por edad', 'not_evaluated')
  }
  if (!density.data.inCoverage || !density.data.distribucionPorEdad) {
    return criterion('audience', label, yourBusiness, 'Fuera de la cobertura del censo (CABA)', 'not_evaluated')
  }

  const ageDist = density.data.distribucionPorEdad
  const sexDist = density.data.distribucionPorSexo

  const targetCount = selectedCodes.reduce(
    (sum, code) => sum + (ageDist[code]?.poblacionEstimada ?? 0),
    0,
  )
  const targetShare = Number(
    selectedCodes.reduce((sum, code) => sum + (ageDist[code]?.porcentaje ?? 0), 0).toFixed(1),
  )
  const expectedShare = selectedCodes.reduce(
    (sum, code) => sum + (AUDIENCE.expectedShareByGroup[code] ?? 25),
    0,
  )

  const sexSummary =
    sexDist && sexDist.predominio !== 'sin_datos'
      ? ` · ${Number(sexDist.porcentajeMujeres.toFixed(1)).toLocaleString('es-AR')}% mujeres y ${Number(sexDist.porcentajeVarones.toFixed(1)).toLocaleString('es-AR')}% varones`
      : ''

  const zone = `${formatInt(targetCount)} hab. de tu rango (${targetShare.toLocaleString('es-AR')}% del radio${sexSummary})`

  const shareRatio = expectedShare > 0 ? targetShare / expectedShare : 1
  let reading = 'alert'
  if (targetCount < AUDIENCE.minAlertCount || shareRatio < AUDIENCE.weaknessRatio) {
    reading = 'weakness'
  } else if (targetCount >= AUDIENCE.minStrengthCount && shareRatio >= AUDIENCE.strengthRatio) {
    reading = 'strength'
  }

  return criterion('audience', label, yourBusiness, zone, reading)
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
  const atLeast = total >= COMPETITION.maxResults && !competition.data.isExact ? 'Al menos ' : ''
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

/** Accesibilidad: estaciones de subte, tren y paradas de transporte en el radio vs. cómo llega el cliente. */
export function accessibilityCriterion({ answerCode, answerLabel, accessibility, noPublic }) {
  const yourBusiness = answerLabel ? answerLabel('arrival_type') : null
  const code = answerCode ? answerCode('arrival_type') : null
  const label = 'Accesibilidad'

  if (noPublic) {
    return notApplicableCriterion('accessibility', label, yourBusiness)
  }
  if (!code || code === 'unknown') {
    return undefinedAnswerCriterion('accessibility', label, yourBusiness, 'Sin definir cómo llega tu cliente')
  }
  if (!accessibility || accessibility.status !== 'ok') {
    return criterion('accessibility', label, yourBusiness, 'No pudimos obtener la accesibilidad', 'not_evaluated')
  }

  const { total, subwayCount, trainCount, busCount } = accessibility.data
  const zoneParts = []
  if (subwayCount > 0) {
    zoneParts.push(`${subwayCount} ${subwayCount === 1 ? 'estación de subte' : 'estaciones de subte'}`)
  }
  if (trainCount > 0) {
    zoneParts.push(`${trainCount} ${trainCount === 1 ? 'estación de tren' : 'estaciones de tren'}`)
  }
  if (busCount > 0) {
    zoneParts.push(`${busCount} ${busCount === 1 ? 'parada de colectivo' : 'paradas de colectivo'}`)
  }
  const zone = zoneParts.length > 0 ? `${zoneParts.join(' y ')} en el radio` : 'Sin paradas registradas en el radio'

  let reading
  if (subwayCount > 0 || trainCount > 0 || total >= 6) {
    reading = 'strength'
  } else if (total >= 2) {
    reading = 'alert'
  } else {
    reading = 'weakness'
  }

  return criterion('accessibility', label, yourBusiness, zone, reading)
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
