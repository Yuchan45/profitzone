import { env } from '../config/env.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? (err.message?.startsWith('Origen no permitido por CORS') ? 403 : 500)

  if (status >= 500) {
    console.error('[ProfitZone] Error no controlado:', err)
  }

  // En producción se oculta el mensaje de los errores no controlados (sin `status`: pueden traer
  // detalles internos). Los esperados (httpError, aunque sean 5xx como "te devolvimos el
  // crédito") se escribieron para el usuario y se muestran.
  const unexpected = err.status === undefined
  res.status(status).json({
    status: 'error',
    message: status >= 500 && unexpected && env.isProduction ? 'Error interno del servidor' : err.message,
    ...(err.appCode ? { code: err.appCode } : {}),
  })
}
