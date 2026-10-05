import {
  getAnalysis,
  createAnalysis,
  replaceAnalysisAnswers,
  updateAnalysisLocation,
  RADIUS_MIN_M,
  RADIUS_MAX_M,
} from '../services/analyses.service.js'

function badRequest(message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** `answers` tiene que ser { [questionCode]: optionCode[] }. */
function parseAnswers(answers) {
  if (!isPlainObject(answers)) {
    throw badRequest('"answers" debe ser un objeto con las respuestas por pregunta.')
  }
  for (const [questionCode, optionCodes] of Object.entries(answers)) {
    if (!Array.isArray(optionCodes) || optionCodes.some((code) => typeof code !== 'string')) {
      throw badRequest(`La respuesta de "${questionCode}" debe ser una lista de opciones.`)
    }
  }
  return answers
}

function parseCode(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`El campo "${name}" es obligatorio.`)
  }
  return value.trim()
}

function parseCoordinate(value, name, limit) {
  if (typeof value !== 'number' || Number.isNaN(value) || value < -limit || value > limit) {
    throw badRequest(`El campo "${name}" debe ser un número entre -${limit} y ${limit}.`)
  }
  return value
}

export async function getAnalysisById(req, res) {
  res.json(await getAnalysis(req.params.id))
}

export async function postAnalysis(req, res) {
  const body = req.body ?? {}
  const analysis = await createAnalysis({
    categoryCode: parseCode(body.categoryCode, 'categoryCode'),
    subcategoryCode: parseCode(body.subcategoryCode, 'subcategoryCode'),
    answers: parseAnswers(body.answers),
  })
  res.status(201).json(analysis)
}

export async function putAnalysisAnswers(req, res) {
  const body = req.body ?? {}
  res.json(await replaceAnalysisAnswers(req.params.id, parseAnswers(body.answers)))
}

export async function patchAnalysisLocation(req, res) {
  const body = req.body ?? {}
  const { radius } = body

  if (!Number.isInteger(radius) || radius < RADIUS_MIN_M || radius > RADIUS_MAX_M) {
    throw badRequest(`El radio debe ser un número entero entre ${RADIUS_MIN_M} y ${RADIUS_MAX_M} metros.`)
  }

  const analysis = await updateAnalysisLocation(req.params.id, {
    lat: parseCoordinate(body.lat, 'lat', 90),
    lng: parseCoordinate(body.lng, 'lng', 180),
    radius,
  })
  res.json(analysis)
}
