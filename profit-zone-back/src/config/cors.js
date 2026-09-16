import { env } from './env.js'

export const corsOptions = {
  origin(origin, callback) {
    // Sin header Origin: peticiones same-origin, curl, Postman o healthchecks.
    if (!origin) {
      return callback(null, true)
    }

    if (env.corsOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}
