import { sequelize } from '../db/sequelize.js'
import { ANALYSIS_STATUSES } from '../models/analysis/Analysis.js'
import {
  Analysis,
  AnalysisAnswer,
  Category,
  Subcategory,
  Question,
  QuestionOption,
} from '../models/index.js'
import { getSubcategorySurvey } from './questions.service.js'
import { availableNeighborhoodNames, findAvailableNeighborhood } from './neighborhoods.service.js'
import { reverseGeocode } from './geocode.service.js'
import { httpError } from '../utils/httpErrors.js'

// Rango del radio de análisis en metros. Hasta RADIUS_FREE_MAX_M es para todos; más allá,
// solo los roles con radio ilimitado (mismo rango que el slider del paso 3 en el front)
const RADIUS_MIN_M = 100
const RADIUS_MAX_M = 2000
const RADIUS_FREE_MAX_M = 600
// Plan a futuro (ver "Plan premium" en el README): también limitar la cantidad de reportes por
// usuario free (más de 3 solo premium). Hoy no hay límite.
const UNLIMITED_RADIUS_ROLES = ['premium', 'admin']

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Largo máximo del nombre del análisis (columna name nvarchar(80))
const NAME_MAX_LENGTH = 80

function badRequest(message) {
  return httpError(400, message)
}

function notFound(id) {
  return httpError(404, `No existe el análisis "${id}".`)
}

/** Datos del análisis sin las respuestas: alcanza para listarlo. */
function toAnalysisSummaryDto(analysis) {
  return {
    // SQL Server devuelve los uniqueidentifier en mayúsculas
    id: analysis.id.toLowerCase(),
    status: analysis.status,
    // null si el usuario no lo renombró: el front muestra el rubro
    name: analysis.name,
    // Dirección del punto (null sin ubicación o si no se encontró una)
    address: analysis.address,
    category: {
      code: analysis.subcategory.category.code,
      name: analysis.subcategory.category.name,
    },
    subcategory: { code: analysis.subcategory.code, name: analysis.subcategory.name },
    location:
      analysis.radiusM === null
        ? null
        : {
            lat: Number(analysis.centerLat),
            lng: Number(analysis.centerLng),
            radius: analysis.radiusM,
          },
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  }
}

function toAnalysisDto(analysis) {
  // Una fila por opción elegida: se agrupan por pregunta
  const answers = {}
  for (const answer of analysis.answers) {
    const questionCode = answer.question.code
    answers[questionCode] = [...(answers[questionCode] ?? []), answer.option.code]
  }

  return { ...toAnalysisSummaryDto(analysis), answers }
}

function sameId(a, b) {
  // SQL Server devuelve los uniqueidentifier en mayúsculas
  return String(a).toLowerCase() === String(b).toLowerCase()
}

/**
 * Busca el análisis y verifica el acceso: solo lo ve su dueño. Para cualquier
 * otro usuario responde 404, sin revelar que existe. `userId` es el usuario de la sesión.
 */
async function findAnalysis(id, userId, { transaction } = {}) {
  // Un id con otro formato haría fallar la conversión a uniqueidentifier en SQL Server
  if (!UUID_PATTERN.test(id)) throw notFound(id)

  const analysis = await Analysis.findByPk(id, {
    transaction,
    include: [
      {
        model: Subcategory,
        as: 'subcategory',
        include: [{ model: Category, as: 'category' }],
      },
      {
        model: AnalysisAnswer,
        as: 'answers',
        include: [
          { model: Question, as: 'question' },
          { model: QuestionOption, as: 'option' },
        ],
      },
    ],
    order: [[{ model: AnalysisAnswer, as: 'answers' }, 'id', 'ASC']],
  })

  if (!analysis) throw notFound(id)
  if (!sameId(analysis.userId, userId)) throw notFound(id)
  return analysis
}

/**
 * Codes de las preguntas que ocultan las opciones elegidas (`metadata.hideQuestions`).
 * El front aplica la misma regla en src/utils/hiddenQuestions.js: mantenerlas iguales.
 */
function hiddenQuestionCodes(questions, answers) {
  const hidden = new Set()
  for (const question of questions) {
    for (const optionCode of answers[question.code] ?? []) {
      const option = question.options.find((o) => o.code === optionCode)
      for (const code of option?.metadata?.hideQuestions ?? []) hidden.add(code)
    }
  }
  return hidden
}

/**
 * Valida las respuestas contra la encuesta del rubro y las traduce a filas de
 * analysis_answers. `rawAnswers`: { [questionCode]: optionCode[] }.
 */
async function buildAnswerRows(categoryCode, subcategoryCode, rawAnswers) {
  const survey = await getSubcategorySurvey(categoryCode, subcategoryCode)
  const surveyQuestions = new Map(
    [...survey.business, ...survey.details].map((question) => [question.code, question]),
  )

  // Primero se validan todas las respuestas que llegaron, incluidas las de preguntas ocultas
  for (const [questionCode, optionCodes] of Object.entries(rawAnswers)) {
    const question = surveyQuestions.get(questionCode)
    if (!question) {
      throw badRequest(`La pregunta "${questionCode}" no corresponde a este rubro.`)
    }
    const validOptions = new Set(question.options.map((option) => option.code))
    const invalid = optionCodes.find((code) => !validOptions.has(code))
    if (invalid) {
      throw badRequest(`La opción "${invalid}" no corresponde a la pregunta "${question.prompt}".`)
    }
    if (question.inputType === 'single_choice' && optionCodes.length > 1) {
      throw badRequest(`La pregunta "${question.prompt}" admite una sola respuesta.`)
    }
  }

  // Las preguntas que oculta una respuesta (ej. "Sin atención al público") no se
  // piden ni se guardan, aunque el cliente las mande
  const hidden = hiddenQuestionCodes([...surveyQuestions.values()], rawAnswers)
  const answers = Object.fromEntries(Object.entries(rawAnswers).filter(([code]) => !hidden.has(code)))

  const missing = [...surveyQuestions.values()].filter(
    (question) => question.isRequired && !hidden.has(question.code) && !(answers[question.code]?.length > 0),
  )
  if (missing.length > 0) {
    throw badRequest(`Faltan responder: ${missing.map((question) => question.prompt).join(' ')}`)
  }

  // La encuesta trae codes: se buscan los ids para guardar
  const questions = await Question.findAll({
    where: { code: Object.keys(answers) },
    include: [{ model: QuestionOption, as: 'options' }],
  })

  return questions.flatMap((question) =>
    // Sin duplicados: UQ_analysis_answers_analysis_question_option
    [...new Set(answers[question.code])].map((optionCode) => ({
      questionId: question.id,
      optionId: question.options.find((option) => option.code === optionCode).id,
    })),
  )
}

/**
 * Análisis del usuario para "Mis reportes", del más reciente al más viejo.
 * `status`: 'saved' (reportes guardados: se analizó la zona) o 'draft'
 * (borradores: completaron "Tu negocio" pero no la ubicación; se retoman desde el flujo).
 */
export async function listUserAnalyses(userId, status) {
  if (!ANALYSIS_STATUSES.includes(status)) {
    throw badRequest(`El estado debe ser uno de: ${ANALYSIS_STATUSES.join(', ')}.`)
  }
  const analyses = await Analysis.findAll({
    where: { userId, status },
    include: [
      {
        model: Subcategory,
        as: 'subcategory',
        include: [{ model: Category, as: 'category' }],
      },
    ],
    order: [['updatedAt', 'DESC']],
  })
  return analyses.map(toAnalysisSummaryDto)
}

/** Devuelve un análisis con su rubro, ubicación y respuestas. Lanza 404 si no existe. */
export async function getAnalysis(id, userId) {
  return toAnalysisDto(await findAnalysis(id, userId))
}

/**
 * Crea un análisis en borrador, a nombre del usuario, con el rubro y las respuestas
 * del paso 2. Sin sesión no se crea: el flujo anónimo vive solo en el front.
 */
export async function createAnalysis({ categoryCode, subcategoryCode, answers }, userId) {
  const answerRows = await buildAnswerRows(categoryCode, subcategoryCode, answers)
  // buildAnswerRows ya validó que el rubro exista y esté activo
  const subcategory = await Subcategory.findOne({
    where: { code: subcategoryCode },
    include: [{ model: Category, as: 'category', where: { code: categoryCode } }],
  })

  const id = await sequelize.transaction(async (transaction) => {
    const analysis = await Analysis.create(
      { subcategoryId: subcategory.id, userId },
      { transaction },
    )
    await AnalysisAnswer.bulkCreate(
      answerRows.map((row) => ({ ...row, analysisId: analysis.id })),
      { transaction },
    )
    return analysis.id
  })

  return getAnalysis(id, userId)
}

/** Reemplaza todas las respuestas de un análisis (el usuario volvió al paso 2 y las cambió). */
export async function replaceAnalysisAnswers(id, answers, userId) {
  const analysis = await findAnalysis(id, userId)
  const answerRows = await buildAnswerRows(
    analysis.subcategory.category.code,
    analysis.subcategory.code,
    answers,
  )

  await sequelize.transaction(async (transaction) => {
    await AnalysisAnswer.destroy({ where: { analysisId: id }, transaction })
    await AnalysisAnswer.bulkCreate(
      answerRows.map((row) => ({ ...row, analysisId: id })),
      { transaction },
    )
    // Las respuestas no tocan la fila del análisis: se marca el cambio a mano
    analysis.changed('updatedAt', true)
    await analysis.save({ transaction })
  })

  return getAnalysis(id, userId)
}

/**
 * Guarda el punto y el radio elegidos en el paso 3 ("Analizar zona"). Con la ubicación
 * el análisis está completo: pasa a reporte guardado y aparece en "Mis reportes".
 * Volver a analizar (otro punto u otro radio) actualiza el mismo reporte.
 */
export async function updateAnalysisLocation(id, { lat, lng, radius }, { id: userId, role }) {
  if (!Number.isInteger(radius) || radius < RADIUS_MIN_M || radius > RADIUS_MAX_M) {
    throw badRequest(`El radio debe ser un número entero entre ${RADIUS_MIN_M} y ${RADIUS_MAX_M} metros.`)
  }
  // Primero el dueño: un análisis ajeno o inexistente responde 404, no el límite del plan
  const analysis = await findAnalysis(id, userId)
  if (radius > RADIUS_FREE_MAX_M && !UNLIMITED_RADIUS_ROLES.includes(role)) {
    throw httpError(403, `Los radios de más de ${RADIUS_FREE_MAX_M} m son para planes pagos.`)
  }
  if (!(await findAvailableNeighborhood(lat, lng))) {
    throw httpError(422, `Elegí un punto dentro de ${availableNeighborhoodNames()}.`)
  }
  await analysis.update({
    centerLat: lat,
    centerLng: lng,
    radiusM: radius,
    address: await findAddress(analysis, { lat, lng }),
    status: 'saved',
  })
  return getAnalysis(id, userId)
}

/**
 * Dirección del punto para mostrar en "Mis reportes". Es un dato de apoyo: si la búsqueda
 * falla, el análisis se guarda igual. Con el mismo punto se conserva la que ya tenía.
 * reverseGeocode cachea por punto: casi siempre es la que el front ya pidió en el paso 3.
 */
async function findAddress(analysis, point) {
  const samePoint =
    Number(analysis.centerLat) === point.lat && Number(analysis.centerLng) === point.lng
  try {
    const { label } = await reverseGeocode(point)
    return label ?? (samePoint ? analysis.address : null)
  } catch {
    return samePoint ? analysis.address : null
  }
}

/**
 * Renombra un análisis (borrador o reporte guardado). Un nombre vacío lo vuelve a
 * NULL: el front muestra el rubro.
 */
export async function renameAnalysis(id, name, userId) {
  const trimmed = name?.trim() || null
  if (trimmed && trimmed.length > NAME_MAX_LENGTH) {
    throw badRequest(`El nombre puede tener hasta ${NAME_MAX_LENGTH} caracteres.`)
  }
  const analysis = await findAnalysis(id, userId)
  await analysis.update({ name: trimmed })
  return getAnalysis(id, userId)
}

/** Elimina un análisis, borrador o reporte guardado (sus respuestas caen por ON DELETE CASCADE). */
export async function deleteUserAnalysis(id, userId) {
  const analysis = await findAnalysis(id, userId)
  await analysis.destroy()
}
