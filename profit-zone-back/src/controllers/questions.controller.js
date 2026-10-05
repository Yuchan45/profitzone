import { listQuestions, getQuestionByCode } from '../services/questions.service.js'
import { ASSIGNMENT_SCOPES } from '../models/catalog/QuestionAssignment.js'
import { parseBooleanQuery } from '../utils/query.js'

export async function getQuestions(req, res) {
  const { scope } = req.query
  const active = parseBooleanQuery(req.query.active, 'active')

  if (scope !== undefined && scope !== '' && !ASSIGNMENT_SCOPES.includes(scope)) {
    const error = new Error(`El parámetro "scope" debe ser uno de: ${ASSIGNMENT_SCOPES.join(', ')}.`)
    error.status = 400
    throw error
  }

  res.json(await listQuestions({ scope: scope || undefined, active }))
}

export async function getQuestion(req, res) {
  const active = parseBooleanQuery(req.query.active, 'active')
  res.json(await getQuestionByCode(req.params.code, { active }))
}
