import { listQuestions, getQuestionByCode } from '../services/questions.service.js'
import { parseBooleanQuery } from '../utils/query.js'

export async function getQuestions(req, res) {
  const { scope } = req.query
  const active = parseBooleanQuery(req.query.active, 'active')
  res.json(await listQuestions({ scope: scope || undefined, active }))
}

export async function getQuestion(req, res) {
  const active = parseBooleanQuery(req.query.active, 'active')
  res.json(await getQuestionByCode(req.params.code, { active }))
}
