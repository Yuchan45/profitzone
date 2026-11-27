import {
  listUserAnalyses,
  getAnalysis,
  createAnalysis,
  replaceAnalysisAnswers,
  updateAnalysisLocation,
  upgradeAnalysis,
  deleteUserAnalysis,
  renameAnalysis,
} from '../services/analyses.service.js'
import { openAnalysisReport } from '../services/analysisReport.service.js'
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

// Sin ?status= lista los reportes guardados: es lo que muestra "Mis reportes" por defecto
export async function getMyAnalyses(req, res) {
  res.json(await listUserAnalyses(req.user.id, req.query.status ?? 'saved', req.user.role))
}

// `name`: texto o null (null o vacío vuelve a mostrar el rubro). El largo lo valida el service
export async function patchAnalysis(req, res) {
  const { name } = req.body ?? {}
  if (name !== null && typeof name !== 'string') {
    throw badRequest('El campo "name" debe ser un texto o null.')
  }
  res.json(await renameAnalysis(req.params.id, name, req.user.id))
}

export async function deleteAnalysis(req, res) {
  await deleteUserAnalysis(req.params.id, req.user.id)
  res.status(204).end()
}

export async function getAnalysisById(req, res) {
  res.json(await getAnalysis(req.params.id, req.user.id))
}

export async function getAnalysisReport(req, res) {
  res.json(await openAnalysisReport(req.params.id, req.user))
}

// Mejora un análisis básico a completo con un crédito pago (sin repetir la encuesta ni el punto)
export async function postAnalysisUpgrade(req, res) {
  res.json(await upgradeAnalysis(req.params.id, req.user))
}

export async function postAnalysis(req, res) {
  const body = req.body ?? {}
  const analysis = await createAnalysis({
    categoryCode: parseCode(body.categoryCode, 'categoryCode'),
    subcategoryCode: parseCode(body.subcategoryCode, 'subcategoryCode'),
    answers: parseAnswers(body.answers),
  }, req.user.id)
  res.status(201).json(analysis)
}

export async function putAnalysisAnswers(req, res) {
  const body = req.body ?? {}
  res.json(await replaceAnalysisAnswers(req.params.id, parseAnswers(body.answers), req.user.id))
}

export async function patchAnalysisLocation(req, res) {
  const body = req.body ?? {}
  if (body.tier !== undefined && typeof body.tier !== 'string') {
    throw badRequest('El campo "tier" debe ser un texto ("basic" o "complete").')
  }
  // El rango del radio y el nivel son reglas de negocio: las valida el service
  const analysis = await updateAnalysisLocation(req.params.id, {
    lat: parseCoordinate(body.lat, 'lat', 90),
    lng: parseCoordinate(body.lng, 'lng', 180),
    radius: body.radius,
    tier: body.tier,
  }, req.user)
  res.json(analysis)
}
