import { env } from '../config/env.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isBadJson = err.type === 'entity.parse.failed'
  const status = err.status ?? err.statusCode ?? (err.message?.startsWith('Origen no permitido por CORS') ? 403 : 500)

  if (status >= 500) {
    console.error('[ProfitZone] Error no controlado:', err)
  }

  const message = isBadJson
    ? 'El cuerpo de la petición no es un JSON válido.'
    : status >= 500 && env.isProduction
      ? 'Error interno del servidor'
      : err.message || 'Ocurrió un error inesperado.'

  res.status(status).json({
    status: 'error',
    message,
  })
}
