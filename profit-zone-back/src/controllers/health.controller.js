import { env } from '../config/env.js'

export function getHealth(req, res) {
  res.json({
    status: 'ok',
    service: 'profit-zone-back',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  })
}
