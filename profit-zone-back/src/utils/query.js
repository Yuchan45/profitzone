/**
 * Convierte un query param booleano ('true' / 'false') a boolean.
 * Devuelve undefined si no vino, y lanza un 400 si trae otro valor.
 */
export function parseBooleanQuery(value, name) {
  if (value === undefined || value === '') return undefined
  if (value === 'true') return true
  if (value === 'false') return false

  const error = new Error(`El parámetro "${name}" debe ser "true" o "false".`)
  error.status = 400
  throw error
}
