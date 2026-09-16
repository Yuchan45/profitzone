import 'dotenv/config'

/**
 * Esquema de variables de entorno.
 * required: si falta, el proceso no arranca.
 * parse: transforma el string del .env al tipo que usa la app.
 */
const schema = {
  NODE_ENV: {
    required: false,
    default: 'development',
    validate: (value) => ['development', 'test', 'production'].includes(value),
    message: 'debe ser development, test o production',
  },
  PORT: {
    required: false,
    default: '8080',
    parse: Number,
    validate: (value) => Number.isInteger(value) && value > 0 && value < 65536,
    message: 'debe ser un puerto válido (1-65535)',
  },
  CORS_ORIGINS: {
    required: true,
    parse: (value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    validate: (value) => value.length > 0 && value.every((origin) => /^https?:\/\/.+/.test(origin)),
    message: 'debe ser una lista separada por comas de URLs http(s), ej: http://localhost:5173',
  },
}

function loadEnv() {
  const errors = []
  const config = {}

  for (const [key, rule] of Object.entries(schema)) {
    const raw = process.env[key] ?? rule.default

    if (raw === undefined || raw === '') {
      if (rule.required) {
        errors.push(`- ${key}: es obligatoria y no está definida`)
      }
      continue
    }

    const value = rule.parse ? rule.parse(raw) : raw

    if (rule.validate && !rule.validate(value)) {
      errors.push(`- ${key}: ${rule.message}`)
      continue
    }

    config[key] = value
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuración de entorno inválida. Revisá tu archivo .env (podés copiar .env.example):\n${errors.join('\n')}`,
    )
  }

  return Object.freeze({
    nodeEnv: config.NODE_ENV,
    port: config.PORT,
    corsOrigins: config.CORS_ORIGINS,
    isProduction: config.NODE_ENV === 'production',
  })
}

export const env = loadEnv()
