import { getHealthStatus } from '../services/health.service.js'

export async function getHealth(req, res) {
  const health = await getHealthStatus()
  res.status(health.database === 'up' ? 200 : 503).json(health)
}
