import { getCompetitionAnalysis } from '../services/competition.service.js'
import { httpError } from '../utils/httpErrors.js'
import { parseLocationQuery } from '../utils/query.js'

export async function getCompetition(req, res) {
  const { lat, lng, radiusInMeters } = parseLocationQuery(req.query, { defaultRadius: 1000 })
  const { category, subcategory, match } = req.query

  let parsedMatch = null
  if (match !== undefined && match !== '') {
    if (typeof match !== 'string' || !match.includes(':')) {
      throw httpError(400, 'El parámetro "match" debe tener el formato "pregunta:opción".')
    }
    parsedMatch = match.trim()
  }

  const result = await getCompetitionAnalysis({
    lat,
    lng,
    radiusInMeters,
    categoryCode: typeof category === 'string' && category.trim() ? category.trim() : undefined,
    subcategory: typeof subcategory === 'string' && subcategory.trim() ? subcategory.trim() : 'restaurante',
    match: parsedMatch,
  })

  res.json(result)
}
