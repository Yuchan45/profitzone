// Runner de migraciones (Umzug). Crea la base si no existe y aplica/revierte
// las migraciones de src/db/migrations en orden.
//
// Uso (desde profit-zone-back/):
//   npm run db:migrate                 aplica las pendientes
//   npm run db:migrate:undo            revierte la última
//   npm run db:migrate:undo -- all     revierte todas
//   npm run db:migrate:status          lista aplicadas y pendientes
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SequelizeStorage, Umzug } from 'umzug'
import { env } from '../src/config/env.js'
import { createSequelize } from '../src/db/sequelize.js'

const PREFIX = '[ProfitZone]'
const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/db/migrations')

async function ensureDatabase() {
  const master = createSequelize('master')
  try {
    // DB_NAME ya viene validado como identificador simple en src/config/env.js.
    await master.query(`IF DB_ID(N'${env.db.name}') IS NULL CREATE DATABASE [${env.db.name}]`)
  } finally {
    await master.close()
  }
}

function createUmzug(sequelize) {
  return new Umzug({
    // glob necesita barras "/" también en Windows.
    migrations: {
      glob: `${migrationsDir.replaceAll('\\', '/')}/*.js`,
      resolve: ({ name, path: file, context }) => ({
        name,
        up: async () => (await import(pathToFileURL(file).href)).up(context),
        down: async () => (await import(pathToFileURL(file).href)).down(context),
      }),
    },
    context: { sequelize },
    storage: new SequelizeStorage({ sequelize }),
    logger: undefined,
  })
}

const command = process.argv[2] ?? 'up'
let sequelize

try {
  await ensureDatabase()
  sequelize = createSequelize()
  const umzug = createUmzug(sequelize)

  if (command === 'up') {
    const applied = await umzug.up()
    console.log(
      applied.length
        ? `${PREFIX} Migraciones aplicadas: ${applied.map((m) => m.name).join(', ')}`
        : `${PREFIX} No hay migraciones pendientes.`,
    )
  } else if (command === 'down') {
    const reverted = process.argv[3] === 'all' ? await umzug.down({ to: 0 }) : await umzug.down()
    console.log(
      reverted.length
        ? `${PREFIX} Migraciones revertidas: ${reverted.map((m) => m.name).join(', ')}`
        : `${PREFIX} No hay migraciones para revertir.`,
    )
  } else if (command === 'status') {
    const executed = await umzug.executed()
    const pending = await umzug.pending()
    console.log(`${PREFIX} Aplicadas (${executed.length}): ${executed.map((m) => m.name).join(', ') || '-'}`)
    console.log(`${PREFIX} Pendientes (${pending.length}): ${pending.map((m) => m.name).join(', ') || '-'}`)
  } else {
    throw new Error(`comando desconocido "${command}". Usá up, down o status.`)
  }
} catch (error) {
  console.error(`${PREFIX} Error en migraciones: ${error.message}`)
  process.exitCode = 1
} finally {
  await sequelize?.close()
}
