import { env } from '../config/env.js'
import { isDatabaseUp } from '../db/sequelize.js'

export async function getHealthStatus() {
  const databaseUp = await isDatabaseUp()
  return {
    status: databaseUp ? 'ok' : 'degraded',
    service: 'profit-zone-back',
    environment: env.nodeEnv,
    database: databaseUp ? 'up' : 'down',
    timestamp: new Date().toISOString(),
  }
}
