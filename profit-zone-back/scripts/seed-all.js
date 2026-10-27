// Aplica las migraciones y corre todos los seeds en orden, para dejar la base al
// día de una. Cada paso corre en su propio proceso con el script de siempre
// (npm run db:migrate, db:seed:*), así la salida y los errores son los mismos.
//
// - Si fallan las migraciones, se corta: los seeds necesitan la DB migrada.
// - Los locales se saltean si falta el JSON de Zonaprop (no está en el repo).
// - OSM necesita el censo: si el censo falla, se saltea.
// - Cualquier otro fallo no frena al resto; al final se muestra un resumen.
//
// Uso (desde profit-zone-back/): npm run db:seed:all
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PREFIX = '[ProfitZone]'
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const RENTALS_DATA = path.resolve(scriptsDir, '../src/db/seeders/data/zonaprop_locales_caba_alquiler.json')

const STEPS = [
  { name: 'migraciones', script: 'migrate.js', args: ['up'], required: true },
  { name: 'catálogo', script: 'seed-catalog.js' },
  { name: 'censo', script: 'seed-census.js' },
  {
    name: 'locales',
    script: 'seed-commercial-rentals.js',
    skipIf: () =>
      !fs.existsSync(RENTALS_DATA) &&
      `falta ${path.relative(process.cwd(), RENTALS_DATA)} (no se versiona: pedíselo al equipo)`,
  },
  {
    name: 'negocios OSM',
    script: 'seed-osm-places.js',
    skipIf: (results) => results.censo !== 'ok' && 'requiere el censo cargado',
  },
  {
    name: 'lugares por público OSM',
    script: 'seed-osm-audience-places.js',
    skipIf: (results) => results.censo !== 'ok' && 'requiere el censo cargado',
  },
]

const results = {}
const summary = []

for (const step of STEPS) {
  const skipReason = step.skipIf?.(results)
  if (skipReason) {
    console.warn(`\n${PREFIX} Salteado: ${step.name} (${skipReason})`)
    results[step.name] = 'salteado'
    summary.push({ paso: step.name, resultado: 'salteado', detalle: skipReason })
    continue
  }

  console.log(`\n${PREFIX} ── ${step.name} ──`)
  const started = Date.now()
  const { status } = spawnSync(process.execPath, [path.join(scriptsDir, step.script), ...(step.args ?? [])], {
    stdio: 'inherit',
  })
  const seconds = `${Math.round((Date.now() - started) / 1000)} s`
  const ok = status === 0

  results[step.name] = ok ? 'ok' : 'falló'
  summary.push({ paso: step.name, resultado: results[step.name], detalle: seconds })

  if (!ok && step.required) {
    console.error(`${PREFIX} Fallaron las migraciones: no se corren los seeds.`)
    break
  }
}

console.log(`\n${PREFIX} Resumen:`)
console.table(summary)
if (Object.values(results).includes('falló')) process.exitCode = 1
