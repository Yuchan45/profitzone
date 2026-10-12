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
  DB_HOST: {
    required: false,
    default: 'localhost',
  },
  DB_PORT: {
    required: false,
    default: '1433',
    parse: Number,
    validate: (value) => Number.isInteger(value) && value > 0 && value < 65536,
    message: 'debe ser un puerto válido (1-65535)',
  },
  DB_NAME: {
    required: false,
    default: 'ProfitZone',
    // Se interpola en CREATE DATABASE (scripts/migrate.js): solo identificadores simples.
    validate: (value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value),
    message: 'debe ser un identificador simple (letras, números y _), ej: ProfitZone',
  },
  DB_USER: {
    required: false,
    default: 'sa',
  },
  DB_PASSWORD: {
    required: true,
    // Política de SQL Server para sa: 8+ caracteres con 3 de 4 tipos (mayúscula, minúscula, número, símbolo).
    validate: (value) =>
      value.length >= 8 && [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length >= 3,
    message: 'debe tener 8+ caracteres y combinar al menos 3 de: mayúsculas, minúsculas, números y símbolos',
  },
  DB_LOGGING: {
    required: false,
    default: 'false',
    parse: (value) => value === 'true',
  },
  GOOGLE_PLACES_API_KEY: {
    required: false,
    default: '',
  },
  BESTTIME_API_KEY: {
    required: false,
    default: '',
  },
  JWT_ACCESS_SECRET: {
    required: true,
    // HS256: el secreto tiene que ser largo y aleatorio
    validate: (value) => value.length >= 32,
    message: 'debe tener al menos 32 caracteres (generalo con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))")',
  },
  JWT_ACCESS_TTL: {
    required: false,
    default: '15m',
    // Formato de jsonwebtoken: número + unidad (s, m, h, d)
    validate: (value) => /^\d+[smhd]$/.test(value),
    message: 'debe ser un número seguido de s, m, h o d, ej: 15m',
  },
  REFRESH_TOKEN_TTL_DAYS: {
    required: false,
    default: '7',
    parse: Number,
    validate: (value) => Number.isInteger(value) && value >= 1 && value <= 90,
    message: 'debe ser un número entero de días entre 1 y 90',
  },
  COOKIE_SECURE: {
    // Sin definir: true en producción y false en desarrollo (http://localhost)
    required: false,
    validate: (value) => ['true', 'false'].includes(value),
    message: 'debe ser true o false',
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
    googlePlacesApiKey: config.GOOGLE_PLACES_API_KEY ?? '',
    bestTimeApiKey: config.BESTTIME_API_KEY ?? '',
    auth: Object.freeze({
      jwtAccessSecret: config.JWT_ACCESS_SECRET,
      jwtAccessTtl: config.JWT_ACCESS_TTL,
      refreshTokenTtlDays: config.REFRESH_TOKEN_TTL_DAYS,
      cookieSecure:
        config.COOKIE_SECURE === undefined
          ? config.NODE_ENV === 'production'
          : config.COOKIE_SECURE === 'true',
    }),
    db: Object.freeze({
      host: config.DB_HOST,
      port: config.DB_PORT,
      name: config.DB_NAME,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      logging: config.DB_LOGGING,
    }),
  })
}

export const env = loadEnv()
