import { Op, QueryTypes } from 'sequelize'
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
import {
  DEFAULT_TIER,
  RADIUS_MAX_M,
  RADIUS_MIN_M,
  TIERS,
  TIER_CODES,
  entitlementsOf,
} from '../config/plans.js'
import { addCredits, spendCredit } from './credits.service.js'

// El radio de análisis va de RADIUS_MIN_M a RADIUS_MAX_M (mismo rango que el slider del paso 3 en
// el front). Cada nivel tiene su tope: 600 m en el básico y 2 km en el completo (config/plans.js).
// Las cuentas admin no gastan créditos.
const ADMIN_ROLE = 'admin'

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
    // Nivel ('basic' | 'complete'): null mientras es borrador, hasta que se analiza la zona
    tier: analysis.tier,
    entitlements: entitlementsOf(analysis.tier),
    // Qué crédito se gastó ('free' | 'paid'); null si no se cobró
    chargedCredit: analysis.chargedCredit,
    // El reporte de un análisis básico que ya no es el último queda bloqueado (se desbloquea
    // mejorándolo a completo). Solo lo calcula el listado.
    locked: false,
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
export async function listUserAnalyses(userId, status, role) {
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

  // Historial: el análisis básico conserva solo el último reporte; los anteriores quedan
  // bloqueados hasta mejorarlos a completo. El completo (y las cuentas admin) ven todo.
  const latestBasicId = role === ADMIN_ROLE ? null : latestBasicOf(analyses)
  return analyses.map((analysis) => ({
    ...toAnalysisSummaryDto(analysis),
    locked: role !== ADMIN_ROLE && analysis.tier === 'basic' && !sameId(analysis.id, latestBasicId),
  }))
}

// Análisis que se cobraron como básicos: los que siguen siéndolo y los que después se mejoraron
// a completo. Cuentan los dos para decidir cuál es "el último básico": si no, mejorar el último
// desbloquearía gratis el anterior
const startedBasic = (analysis) => analysis.tier === 'basic' || Boolean(analysis.upgradedAt)

/** Id del último análisis cobrado como básico (el que se analizó más recientemente) de una lista. */
function latestBasicOf(analyses) {
  const analyzedAt = (analysis) => new Date(analysis.chargedAt ?? analysis.createdAt).getTime()
  const basics = analyses.filter(startedBasic)
  basics.sort((a, b) => analyzedAt(b) - analyzedAt(a))
  return basics[0]?.id ?? null
}

/** Si el reporte de este análisis está bloqueado (es básico y hay uno más nuevo). */
export async function isReportLocked(analysis, role) {
  if (role === ADMIN_ROLE || analysis.tier !== 'basic') return false
  const basics = await Analysis.findAll({
    where: {
      userId: analysis.userId,
      status: 'saved',
      [Op.or]: [{ tier: 'basic' }, { upgradedAt: { [Op.ne]: null } }],
    },
    attributes: ['id', 'chargedAt', 'createdAt', 'tier', 'upgradedAt'],
  })
  return !sameId(analysis.id, latestBasicOf(basics))
}

/** El análisis tal como está en la base (con su nivel y su cobro), para quien necesita decidir. */
export async function loadAnalysis(id, userId) {
  return findAnalysis(id, userId)
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
 * Guarda el punto y el radio elegidos en el paso 3 ("Analizar zona") y cobra el análisis: con
 * la ubicación el análisis pasa a reporte guardado y aparece en "Mis reportes".
 * - `tier` 'basic' gasta 1 crédito gratis (radio hasta 600 m); 'complete', 1 crédito pago (hasta 2 km).
 * - Volver a analizar el mismo punto y radio no cobra de nuevo (si pide completo sobre un básico,
 *   es una mejora). Con otro punto u otro radio es un análisis nuevo y se cobra otra vez.
 * - Si no alcanzan los créditos responde 402 (INSUFFICIENT_CREDITS) y no se guarda nada.
 */
export async function updateAnalysisLocation(id, { lat, lng, radius, tier = DEFAULT_TIER }, { id: userId, role }) {
  if (!TIER_CODES.includes(tier)) {
    throw badRequest(`El tipo de análisis debe ser uno de: ${TIER_CODES.join(', ')}.`)
  }
  if (!Number.isInteger(radius) || radius < RADIUS_MIN_M || radius > RADIUS_MAX_M) {
    throw badRequest(`El radio debe ser un número entero entre ${RADIUS_MIN_M} y ${RADIUS_MAX_M} metros.`)
  }
  // Primero el dueño: un análisis ajeno o inexistente responde 404, no el límite del plan
  const analysis = await findAnalysis(id, userId)
  if (radius > TIERS[tier].radiusMaxM) {
    throw httpError(
      403,
      `Los radios de más de ${TIERS.basic.radiusMaxM} m son del análisis completo.`,
      'RADIUS_REQUIRES_COMPLETE',
    )
  }
  if (!(await findAvailableNeighborhood(lat, lng))) {
    throw httpError(422, `Elegí un punto dentro de ${availableNeighborhoodNames()}.`)
  }
  const address = await findAddress(analysis, { lat, lng })
  const isAdmin = role === ADMIN_ROLE

  const sameLocation =
    analysis.tier !== null && isSavedPoint(analysis, { lat, lng }) && analysis.radiusM === radius

  await sequelize.transaction(async (transaction) => {
    if (sameLocation) {
      if (tier === 'complete' && analysis.tier === 'basic') {
        await applyUpgrade(analysis, { isAdmin, transaction })
      }
      return
    }
    const creditKind = isAdmin ? null : TIERS[tier].creditKind
    if (creditKind) {
      await spendCredit(userId, creditKind, { reason: 'analysis', analysisId: analysis.id, transaction })
    }
    await analysis.update(
      {
        centerLat: lat,
        centerLng: lng,
        radiusM: radius,
        address,
        status: 'saved',
        tier,
        chargedCredit: creditKind,
        chargedAt: new Date(),
        upgradedAt: null,
        // Hasta que el reporte se genere bien, el cobro se puede devolver
        reportGeneratedAt: null,
      },
      { transaction },
    )
  })
  return getAnalysis(id, userId)
}

// center_lat/center_lng son decimal(9,6): el mapa manda más decimales y la base los redondea.
// Se compara con la misma precisión; si no, el mismo punto nunca coincide y se cobra de nuevo
const COORDINATE_SCALE = 1e6
const toStoredCoordinate = (value) => Math.round(Number(value) * COORDINATE_SCALE)

/** Si `point` es el punto que ya tiene guardado el análisis (con la precisión de la base). */
function isSavedPoint(analysis, point) {
  return (
    analysis.centerLat !== null &&
    toStoredCoordinate(analysis.centerLat) === toStoredCoordinate(point.lat) &&
    toStoredCoordinate(analysis.centerLng) === toStoredCoordinate(point.lng)
  )
}

/** Pasa un análisis básico a completo gastando 1 crédito pago. Dentro de una transacción. */
async function applyUpgrade(analysis, { isAdmin, transaction }) {
  if (!isAdmin) {
    await spendCredit(analysis.userId, 'paid', { reason: 'upgrade', analysisId: analysis.id, transaction })
  }
  await analysis.update({ tier: 'complete', upgradedAt: new Date(), reportGeneratedAt: null }, { transaction })
}

/**
 * Mejora un análisis básico a completo con un crédito pago, sin repetir la encuesta ni volver a
 * marcar el punto. Si ya es completo no cobra (responde igual, sin error).
 */
export async function upgradeAnalysis(id, { id: userId, role }) {
  const analysis = await findAnalysis(id, userId)
  if (analysis.tier === null || analysis.radiusM === null) {
    throw httpError(409, 'Primero analizá la zona para poder mejorar el análisis.', 'NOT_ANALYZED')
  }
  if (analysis.tier === 'complete') return getAnalysis(id, userId)

  await sequelize.transaction((transaction) =>
    applyUpgrade(analysis, { isAdmin: role === ADMIN_ROLE, transaction }),
  )
  return getAnalysis(id, userId)
}

/** Marca que el reporte del nivel actual se generó bien: desde acá el cobro ya no se devuelve. */
export async function markReportGenerated(id) {
  await Analysis.update({ reportGeneratedAt: new Date() }, { where: { id, reportGeneratedAt: null } })
}

/**
 * Si el reporte no se pudo generar, devuelve el crédito: el análisis vuelve a borrador (o, si era
 * una mejora, a básico). Solo si el reporte nunca se generó bien: devuelve false si no hay nada
 * para devolver.
 */
export async function refundAnalysisCharge(id, { id: userId, role }) {
  const analysis = await findAnalysis(id, userId)
  const isAdmin = role === ADMIN_ROLE

  return sequelize.transaction(async (transaction) => {
    // Bloquea la fila y vuelve a leerla: si dos aperturas del reporte fallan a la vez, la
    // segunda espera y ve que la primera ya devolvió el crédito (no lo devuelve dos veces)
    await sequelize.query('SELECT id FROM analysis.analyses WITH (UPDLOCK, ROWLOCK) WHERE id = :id', {
      replacements: { id: analysis.id },
      type: QueryTypes.SELECT,
      transaction,
    })
    await analysis.reload({ transaction })
    if (analysis.tier === null || analysis.reportGeneratedAt !== null) return false

    if (analysis.upgradedAt) {
      if (!isAdmin) {
        await addCredits(userId, 'paid', 1, { reason: 'refund', analysisId: analysis.id, transaction })
      }
      await analysis.update({ tier: 'basic', upgradedAt: null, reportGeneratedAt: new Date() }, { transaction })
      return true
    }
    if (analysis.chargedCredit) {
      await addCredits(userId, analysis.chargedCredit, 1, {
        reason: 'refund',
        analysisId: analysis.id,
        transaction,
      })
    }
    await analysis.update(
      { tier: null, chargedCredit: null, chargedAt: null, status: 'draft' },
      { transaction },
    )
    return true
  })
}

/**
 * Dirección del punto para mostrar en "Mis reportes". Es un dato de apoyo: si la búsqueda
 * falla, el análisis se guarda igual. Con el mismo punto se conserva la que ya tenía.
 * reverseGeocode cachea por punto: casi siempre es la que el front ya pidió en el paso 3.
 */
async function findAddress(analysis, point) {
  const samePoint = isSavedPoint(analysis, point)
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
