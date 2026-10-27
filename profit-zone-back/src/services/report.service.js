import { getAnalysis } from './analyses.service.js'
import { getSubcategorySurvey } from './questions.service.js'
import { getCompetitionAnalysis } from './competition.service.js'
import { getTrafficAnalysis } from './traffic.service.js'
import { getDensityInRadius } from './density.service.js'
import { getRentalsInRadius } from './rentals.service.js'
import { getAccessibilityAnalysis } from './accessibility.service.js'
import { getAudiencePlacesInRadius } from './audiencePlaces.service.js'
import { CRITERIA, buildSummary } from './reportCriteria.service.js'
import { httpError } from '../utils/httpErrors.js'
import { formatArgentinaDate } from '../utils/dates.js'

// Franja horaria que se le pide al servicio de afluencia según las respuestas.
// La franja pico de la subcategoría es más precisa que el horario general.
const TRAFFIC_WINDOWS = {
  peak_slot_cafe: {
    morning: { schedule: 'morning' },
    afternoon: { schedule: 'afternoon' },
    all_day: { schedule: 'day' },
  },
  peak_slot_fitness: {
    morning: { schedule: 'morning' },
    midday: { schedule: 'lunch' },
    evening: { startHour: 17, endHour: 22 },
  },
  schedule: {
    day: { schedule: 'day' },
    // "Nocturno (20 a 2 h)": el perfil horario llega hasta las 23 h (franja "noche, 20 a 23 h")
    night: { schedule: 'dinner' },
    both: { startHour: 8, endHour: 23 },
  },
}

const NOTICES = [
  'La afluencia es un perfil típico del rubro por franja horaria: es estimada y no está medida en este punto.',
  'La demografía viene de los radios censales que tocan el círculo, ponderada por superficie: no refleja diferencias cuadra por cuadra.',
  'Este reporte describe la zona. No indica si conviene o no abrir.',
]

/** Ejecuta la consulta de un indicador sin que su error tumbe el reporte entero. */
async function settleIndicator(name, query) {
  try {
    return { status: 'ok', data: await query() }
  } catch (error) {
    console.warn(`[ProfitZone] No se pudo calcular el indicador "${name}" del reporte: ${error.message}`)
    return { status: 'error', error: 'No pudimos cargar este dato.' }
  }
}

/** Franja para pedir la afluencia y la pregunta de la que salió (para mostrarla en el reporte). */
function resolveTrafficWindow(answerCode) {
  for (const [questionCode, windows] of Object.entries(TRAFFIC_WINDOWS)) {
    const window = windows[answerCode(questionCode)]
    if (window) return { window, questionCode }
  }
  return { window: { schedule: 'day' }, questionCode: null }
}

function resolveDirectMatch(survey, answers) {
  const allQuestions = [...(survey.business || []), ...(survey.details || [])]
  for (const question of allQuestions) {
    for (const code of answers[question.code] ?? []) {
      const option = question.options?.find((o) => o.code === code)
      if (option?.metadata?.osmCuisine?.length) {
        return `${question.code}:${option.code}`
      }
    }
  }
  return null
}

/**
 * La encuesta solo da los textos de las opciones. Si el rubro se desactivó
 * después de crear el análisis, el reporte se arma igual mostrando los codes.
 */
async function getSurveyOrEmpty(categoryCode, subcategoryCode) {
  try {
    return await getSubcategorySurvey(categoryCode, subcategoryCode)
  } catch (error) {
    if (error.status !== 404) throw error
    return { business: [], details: [] }
  }
}

/** Arma los helpers para leer las respuestas del análisis con los textos de la encuesta. */
function buildAnswerReaders(answers, survey) {
  const options = new Map()
  for (const question of [...survey.business, ...survey.details]) {
    for (const option of question.options) {
      options.set(`${question.code}:${option.code}`, option)
    }
  }

  const answerCode = (questionCode) => answers[questionCode]?.[0] ?? null
  const answerCodes = (questionCode) => answers[questionCode] ?? []

  return {
    answerCode,
    answerCodes,
    // Opción completa (con valueMin/valueMax) de una pregunta de respuesta única
    answerOption: (questionCode) => options.get(`${questionCode}:${answerCode(questionCode)}`) ?? null,
    answerLabel: (questionCode) => {
      const codes = answers[questionCode] ?? []
      if (codes.length === 0) return null
      // Si la opción se desactivó en el catálogo, se muestra el code
      return codes.map((code) => options.get(`${questionCode}:${code}`)?.label ?? code).join(' y ')
    },
  }
}

// Las fechas van en hora de Buenos Aires: el servidor puede estar en UTC
function buildSources({ competition, traffic, density, rent, accessibility, audiencePlaces }) {
  const sources = []
  if (competition.status === 'ok') {
    const date = formatArgentinaDate(competition.data.queryDate)
    sources.push(`Competencia: ${competition.data.source}${date ? `, consultado el ${date}` : ''}.`)
  }
  // El servicio de afluencia usa un perfil por rubro, no consulta el punto
  if (traffic.status === 'ok') sources.push('Afluencia: perfil horario típico del rubro (estimado).')
  if (density.status === 'ok') {
    sources.push(
      'Demografía: censo nacional (INDEC) por radio censal y estructura por edad y sexo del Geoportal INDEC (Censo 2022), ponderados por área.',
    )
  }
  if (rent.status === 'ok') {
    // Es la mediana de los avisos dentro del radio, no un promedio oficial del barrio
    const surveyed = rent.data.scrapedAt && formatArgentinaDate(rent.data.scrapedAt)
    const date = surveyed ? `, relevados el ${surveyed}` : ''
    sources.push(
      `Alquiler: mediana de los avisos de locales comerciales en alquiler publicados en ZonaProp dentro del radio${date}. No es un promedio del barrio.`,
    )
  }
  if (accessibility?.status === 'ok') {
    const date = formatArgentinaDate(accessibility.data.queryDate)
    sources.push(`Accesibilidad: ${accessibility.data.source}${date ? `, consultado el ${date}` : ''}.`)
  }
  if (audiencePlaces.status === 'ok' && audiencePlaces.data.byKind.length > 0) {
    const kinds = audiencePlaces.data.byKind.map((item) => item.label).join(', ')
    const date = audiencePlaces.data.updatedAt && formatArgentinaDate(audiencePlaces.data.updatedAt)
    sources.push(`Lugares según tu público: ${kinds} de OpenStreetMap${date ? `, actualizados el ${date}` : ''}.`)
  }
  return sources
}

function summarizeRent({
  radiusInMeters,
  totalInRadius,
  pricedInRadius,
  medianRentArs,
  averageRentArs,
  medianPricePerM2Ars,
  averageSurfaceM2,
  scrapedAt,
}) {
  return {
    radiusInMeters,
    totalInRadius,
    pricedInRadius,
    medianRentArs,
    averageRentArs,
    medianPricePerM2Ars,
    averageSurfaceM2,
    scrapedAt,
  }
}

/**
 * Reporte de zona de un análisis: indicadores del punto y radio elegidos, el
 * cuadro de fortalezas y debilidades cruzado con las respuestas, y un resumen.
 * Si un indicador falla, sus criterios quedan "no evaluados" y el resto sigue.
 */
export async function buildAnalysisReport(id, userId) {
  const analysis = await getAnalysis(id, userId)
  if (!analysis.location) {
    throw httpError(409, 'Elegí la ubicación en el mapa antes de generar el reporte.')
  }

  const survey = await getSurveyOrEmpty(analysis.category.code, analysis.subcategory.code)
  const { answerCode, answerCodes, answerOption, answerLabel } = buildAnswerReaders(analysis.answers, survey)
  const trafficWindow = resolveTrafficWindow(answerCode)
  const noPublic = answerCode('service_mode') === 'no_public'

  const { lat, lng, radius } = analysis.location
  const point = { lat, lng, radiusInMeters: radius }
  const subcategory = analysis.subcategory.code
  const notApplicable = { status: 'not_applicable' }

  // Sin atención al público no se muestran competencia, afluencia ni lugares que atraen al público
  const [competition, traffic, density, rent, accessibility, audiencePlaces] = await Promise.all([
    noPublic
      ? notApplicable
      : settleIndicator('competencia', () =>
          getCompetitionAnalysis({
            ...point,
            categoryCode: analysis.category.code,
            subcategory,
            match: resolveDirectMatch(survey, analysis.answers),
          }),
        ),
    noPublic
      ? notApplicable
      : settleIndicator('afluencia', () =>
          getTrafficAnalysis({ ...point, subcategory, ...trafficWindow.window }),
        ),
    settleIndicator('densidad', () => getDensityInRadius(point)),
    settleIndicator('alquiler', () => getRentalsInRadius(point)),
    settleIndicator('accesibilidad', () => getAccessibilityAnalysis(point)),
    noPublic
      ? notApplicable
      : settleIndicator('lugares según tu público', () =>
          getAudiencePlacesInRadius({ ...point, audiences: answerCodes('target_age') }),
        ),
  ])

  const criteria = CRITERIA.map((buildCriterion) =>
    buildCriterion({
      answerCode,
      answerCodes,
      answerOption,
      answerLabel,
      subcategoryName: analysis.subcategory.name,
      trafficQuestion: trafficWindow.questionCode,
      competition,
      traffic,
      density,
      rent,
      accessibility,
      audiencePlaces,
      noPublic,
    }),
  )

  return {
    analysis: {
      id: analysis.id,
      name: analysis.name,
      address: analysis.address,
      category: analysis.category,
      subcategory: analysis.subcategory,
      location: analysis.location,
      createdAt: analysis.createdAt,
    },
    summary: buildSummary(criteria),
    criteria,
    indicators: {
      competition,
      traffic,
      density,
      accessibility,
      // Sin el listado de avisos: el reporte solo muestra el resumen del alquiler
      rent: rent.status === 'ok' ? { status: 'ok', data: summarizeRent(rent.data) } : rent,
      audiencePlaces,
    },
    sources: buildSources({ competition, traffic, density, rent, accessibility, audiencePlaces }),
    notices: NOTICES,
    generatedAt: new Date().toISOString(),
  }
}
