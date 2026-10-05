import { getAnalysis } from './analyses.service.js'
import { getSubcategorySurvey } from './questions.service.js'
import { getCompetitionAnalysis } from './competition.service.js'
import { getTrafficAnalysis } from './traffic.service.js'
import { getDensityInRadius } from './density.service.js'
import { CRITERIA, buildSummary } from './reportCriteria.js'
import { httpError } from '../utils/httpErrors.js'

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
    night: { schedule: 'night' },
    both: { startHour: 8, endHour: 23 },
  },
}

const NOTICES = [
  'La afluencia es un perfil típico del rubro por franja horaria: es estimada y no está medida en este punto.',
  'La demografía viene de los radios censales que tocan el círculo, ponderada por superficie: no refleja diferencias cuadra por cuadra.',
  'Este reporte describe la zona. No indica si conviene o no abrir.',
]

/** Ejecuta la consulta de un indicador sin que su error tumbe el reporte entero. */
async function settle(name, query) {
  try {
    return { status: 'ok', data: await query() }
  } catch (error) {
    console.warn(`[ProfitZone] No se pudo calcular el indicador "${name}" del reporte: ${error.message}`)
    return { status: 'error', error: 'No pudimos cargar este dato.' }
  }
}

function resolveTrafficWindow(answerCode) {
  for (const [questionCode, windows] of Object.entries(TRAFFIC_WINDOWS)) {
    const window = windows[answerCode(questionCode)]
    if (window) return window
  }
  return { schedule: 'day' }
}

/** Arma los helpers para leer las respuestas del análisis con los textos de la encuesta. */
function buildAnswerReaders(answers, survey) {
  const optionLabels = new Map()
  for (const question of [...survey.business, ...survey.details]) {
    for (const option of question.options) {
      optionLabels.set(`${question.code}:${option.code}`, option.label)
    }
  }

  return {
    answerCode: (questionCode) => answers[questionCode]?.[0] ?? null,
    answerLabel: (questionCode) => {
      const codes = answers[questionCode] ?? []
      if (codes.length === 0) return null
      // Si la opción se desactivó en el catálogo, se muestra el code
      return codes.map((code) => optionLabels.get(`${questionCode}:${code}`) ?? code).join(' y ')
    },
  }
}

function buildSources({ competition, traffic, density }) {
  const sources = []
  if (competition.status === 'ok') {
    const date = new Date(competition.data.queryDate).toLocaleDateString('es-AR')
    sources.push(`Competencia: ${competition.data.source}, consultado el ${date}.`)
  }
  // El servicio de afluencia usa un perfil por rubro, no consulta el punto
  if (traffic.status === 'ok') sources.push('Afluencia: perfil horario típico del rubro (estimado).')
  if (density.status === 'ok') sources.push('Demografía: censo nacional (INDEC) por radio censal, ponderado por área.')
  sources.push('Alquiler, accesibilidad y lugares según tu público: todavía sin fuente de datos.')
  return sources
}

/**
 * Reporte de zona de un análisis: indicadores del punto y radio elegidos, el
 * cuadro de fortalezas y debilidades cruzado con las respuestas, y un resumen.
 * Si un indicador falla, sus criterios quedan "no evaluados" y el resto sigue.
 */
export async function buildAnalysisReport(id) {
  const analysis = await getAnalysis(id)
  if (!analysis.location) {
    throw httpError(409, 'Elegí la ubicación en el mapa antes de generar el reporte.')
  }

  const survey = await getSubcategorySurvey(analysis.category.code, analysis.subcategory.code)
  const { answerCode, answerLabel } = buildAnswerReaders(analysis.answers, survey)
  const noPublic = answerCode('service_mode') === 'no_public'

  const { lat, lng, radius } = analysis.location
  const point = { lat, lng, radiusInMeters: radius }
  const subcategory = analysis.subcategory.code
  const notApplicable = { status: 'not_applicable' }

  // Sin atención al público no se muestran competencia ni afluencia (estados-y-variantes)
  const [competition, traffic, density] = await Promise.all([
    noPublic ? notApplicable : settle('competencia', () => getCompetitionAnalysis({ ...point, subcategory })),
    noPublic
      ? notApplicable
      : settle('afluencia', () =>
          getTrafficAnalysis({ ...point, subcategory, ...resolveTrafficWindow(answerCode) }),
        ),
    settle('densidad', () => getDensityInRadius(point)),
  ])

  const criteria = CRITERIA.map((buildCriterion) =>
    buildCriterion({
      answerCode,
      answerLabel,
      subcategoryName: analysis.subcategory.name,
      competition,
      traffic,
      density,
      noPublic,
    }),
  )

  return {
    analysis: {
      id: analysis.id,
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
      // PZ-41 (alquiler) todavía en curso
      rent: { status: 'unavailable' },
    },
    sources: buildSources({ competition, traffic, density }),
    notices: NOTICES,
    generatedAt: new Date().toISOString(),
  }
}
