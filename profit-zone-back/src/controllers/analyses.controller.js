import {
  getAnalysis,
  createAnalysis,
  replaceAnalysisAnswers,
  updateAnalysisLocation,
} from '../services/analyses.service.js'
import { buildAnalysisReport } from '../services/report.service.js'
import { httpError } from '../utils/httpErrors.js'

function badRequest(message) {
  return httpError(400, message)
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
  res.json(await getAnalysis(req.params.id, req.user?.id))
}

export async function getAnalysisReport(req, res) {
  res.json(await buildAnalysisReport(req.params.id, req.user?.id))
}

export async function postAnalysis(req, res) {
  const body = req.body ?? {}
  const analysis = await createAnalysis({
    categoryCode: parseCode(body.categoryCode, 'categoryCode'),
    subcategoryCode: parseCode(body.subcategoryCode, 'subcategoryCode'),
    answers: parseAnswers(body.answers),
  }, req.user?.id)
  res.status(201).json(analysis)
}

export async function putAnalysisAnswers(req, res) {
  const body = req.body ?? {}
  res.json(await replaceAnalysisAnswers(req.params.id, parseAnswers(body.answers), req.user?.id))
}

export async function patchAnalysisLocation(req, res) {
  const body = req.body ?? {}
  // El rango del radio es regla de negocio: lo valida el service
  const analysis = await updateAnalysisLocation(req.params.id, {
    lat: parseCoordinate(body.lat, 'lat', 90),
    lng: parseCoordinate(body.lng, 'lng', 180),
    radius: body.radius,
  }, req.user.id)
  res.json(analysis)
}
