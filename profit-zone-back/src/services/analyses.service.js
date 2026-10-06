import { sequelize } from '../db/sequelize.js'
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
import { httpError } from '../utils/httpErrors.js'

// Rango del radio de análisis en metros (PZ-16: rango acotado, ej. 200–600 m)
const RADIUS_MIN_M = 200
const RADIUS_MAX_M = 600

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function badRequest(message) {
  return httpError(400, message)
}

function notFound(id) {
  return httpError(404, `No existe el análisis "${id}".`)
}

function toAnalysisDto(analysis) {
  // Una fila por opción elegida: se agrupan por pregunta
  const answers = {}
  for (const answer of analysis.answers) {
    const questionCode = answer.question.code
    answers[questionCode] = [...(answers[questionCode] ?? []), answer.option.code]
  }

  return {
    // SQL Server devuelve los uniqueidentifier en mayúsculas
    id: analysis.id.toLowerCase(),
    status: analysis.status,
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
    answers,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  }
}

function sameId(a, b) {
  // SQL Server devuelve los uniqueidentifier en mayúsculas
  return String(a).toLowerCase() === String(b).toLowerCase()
}

/**
 * Busca el análisis y verifica el acceso: un análisis con dueño solo lo ve su
 * dueño. Para cualquier otro (o sin sesión) responde 404, sin revelar que existe.
 * `userId` es el usuario de la sesión o null.
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
  if (analysis.userId && !(userId && sameId(analysis.userId, userId))) throw notFound(id)
  return analysis
}

/** Codes de las preguntas que ocultan las opciones elegidas (`metadata.hideQuestions`). */
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
 * analysis_answers. `answers`: { [questionCode]: optionCode[] }.
 */
async function buildAnswerRows(categoryCode, subcategoryCode, rawAnswers) {
  const survey = await getSubcategorySurvey(categoryCode, subcategoryCode)
  const allQuestions = [...survey.business, ...survey.details]
  // Las preguntas que oculta una respuesta (ej. "Sin atención al público") no se
  // piden ni se guardan, aunque el cliente las mande
  const hidden = hiddenQuestionCodes(allQuestions, rawAnswers)
  const answers = Object.fromEntries(Object.entries(rawAnswers).filter(([code]) => !hidden.has(code)))
  const surveyQuestions = new Map(
    allQuestions.filter((question) => !hidden.has(question.code)).map((question) => [question.code, question]),
  )

  for (const [questionCode, optionCodes] of Object.entries(answers)) {
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

  const missing = [...surveyQuestions.values()].filter(
    (question) => question.isRequired && !(answers[question.code]?.length > 0),
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

/** Devuelve un análisis con su rubro, ubicación y respuestas. Lanza 404 si no existe. */
export async function getAnalysis(id, userId) {
  return toAnalysisDto(await findAnalysis(id, userId))
}

/**
 * Crea un análisis en borrador con el rubro y las respuestas del paso 2.
 * Con sesión queda a nombre del usuario; sin sesión se asigna al guardar la ubicación.
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
      { subcategoryId: subcategory.id, userId: userId ?? null },
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
 * Guarda el punto y el radio elegidos en el paso 3 ("Analizar zona"). Requiere
 * sesión: si el análisis todavía no tiene dueño, queda a nombre del usuario.
 */
export async function updateAnalysisLocation(id, { lat, lng, radius }, userId) {
  if (!Number.isInteger(radius) || radius < RADIUS_MIN_M || radius > RADIUS_MAX_M) {
    throw badRequest(`El radio debe ser un número entero entre ${RADIUS_MIN_M} y ${RADIUS_MAX_M} metros.`)
  }
  const analysis = await findAnalysis(id, userId)
  if (!(await findAvailableNeighborhood(lat, lng))) {
    throw httpError(422, `Elegí un punto dentro de ${availableNeighborhoodNames()}.`)
  }
  await analysis.update({
    centerLat: lat,
    centerLng: lng,
    radiusM: radius,
    userId: analysis.userId ?? userId,
  })
  return getAnalysis(id, userId)
}
