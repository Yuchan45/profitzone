import { env } from '../config/env.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? (err.message?.startsWith('Origen no permitido por CORS') ? 403 : 500)

  if (status >= 500) {
    console.error('[ProfitZone] Error no controlado:', err)
  }

  res.status(status).json({
    status: 'error',
    message: status >= 500 && env.isProduction ? 'Error interno del servidor' : err.message,
  })
}
