import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Reporte de ejemplo de la home ("Ver reporte de ejemplo"): un restaurante de cocina
// asiática en Palermo Soho. Es un reporte real generado una vez y guardado en un JSON,
// con los locales de Google Places anonimizados (sus términos no permiten guardarlos).
// Para regenerarlo: armar un análisis igual en el flujo y reemplazar el archivo.
const SAMPLE_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/sampleReport.json')

let cached = null

/** Devuelve el reporte de ejemplo (misma forma que GET /api/analyses/:id/report, más `business`). */
export function getSampleReport() {
  cached ??= JSON.parse(fs.readFileSync(SAMPLE_PATH, 'utf8'))
  return cached
}
