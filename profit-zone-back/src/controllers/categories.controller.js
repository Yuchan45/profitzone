import { listCategories, getCategoryByCode } from '../services/categories.service.js'
import { getSubcategorySurvey } from '../services/questions.service.js'
import { parseBooleanQuery } from '../utils/query.js'

export async function getCategories(req, res) {
  const active = parseBooleanQuery(req.query.active, 'active')
  res.json(await listCategories({ active }))
}

export async function getCategory(req, res) {
  const active = parseBooleanQuery(req.query.active, 'active')
  res.json(await getCategoryByCode(req.params.code, { active }))
}

export async function getSubcategoryQuestions(req, res) {
  const { categoryCode, subcategoryCode } = req.params
  res.json(await getSubcategorySurvey(categoryCode, subcategoryCode))
}
