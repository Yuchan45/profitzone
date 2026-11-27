import { Sequelize } from 'sequelize'
import { env } from '../config/env.js'

/**
 * Conexión única a SQL Server. Los módulos ESM se evalúan una sola vez, así que
 * todo el que importe `sequelize` comparte esta instancia (singleton).
 * El esquema lo crean las migraciones (scripts/migrate.js): nunca usar sync().
 */
export function createSequelize(database = env.db.name) {
  return new Sequelize(database, env.db.user, env.db.password, {
    dialect: 'mssql',
    host: env.db.host,
    port: env.db.port,
    timezone: '+00:00',
    logging: env.db.logging ? (sql) => console.log(`[ProfitZone][SQL] ${sql}`) : false,
    dialectOptions: {
      options: {
        // Local: contenedor con certificado autofirmado. Azure SQL (DB_ENCRYPT=true): cifrado con certificado válido
        encrypt: env.db.encrypt,
        trustServerCertificate: !env.db.encrypt,
      },
    },
    // La base gratis de Azure SQL se pausa sola si no se usa y tarda hasta un minuto en reanudarse:
    // mientras tanto rechaza las conexiones (error 40613), así que se reintenta en vez de fallar.
    pool: { acquire: 60000 },
    retry: {
      max: 5,
      backoffBase: 3000,
      backoffExponent: 1.4,
      // Solo errores de conexión: reintentar una consulta que ya se ejecutó a medias podría duplicarla
      match: [/40613/, /not currently available/i, /Failed to connect/i],
    },
    define: {
      underscored: true,
      freezeTableName: true,
    },
  })
}

export const sequelize = createSequelize()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Verifica la conexión al arrancar. Reintenta porque SQL Server puede tardar en
 * aceptar conexiones justo después de `npm run db:up`.
 */
export async function connectDatabase({ retries = 5, delayMs = 2000 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      await sequelize.authenticate()
      return
    } catch (error) {
      if (attempt >= retries) throw error
      console.warn(
        `[ProfitZone] SQL Server no responde (intento ${attempt}/${retries}): ${error.message}. Reintentando...`,
      )
      await wait(delayMs)
    }
  }
}

export async function isDatabaseUp() {
  try {
    await sequelize.authenticate()
    return true
  } catch {
    return false
  }
}

export function closeDatabase() {
  return sequelize.close()
}
