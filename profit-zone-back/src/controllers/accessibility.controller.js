import { getAccessibilityAnalysis } from '../services/accessibility.service.js'
import { parseLocationQuery } from '../utils/query.js'

export async function getAccessibility(req, res) {
  const { lat, lng, radiusInMeters } = parseLocationQuery(req.query, { defaultRadius: 1000 })
  res.json(await getAccessibilityAnalysis({ lat, lng, radiusInMeters }))
}

