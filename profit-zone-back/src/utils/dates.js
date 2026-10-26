const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'
// Sufijo de zona horaria de un ISO: Z, +03:00, -0300…
const HAS_TIME_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i

/**
 * Fecha de un dataset que puede venir sin zona horaria (ej. el scraped_at de
 * ZonaProp, '2026-10-06T16:48:21.000359'): sin zona se toma como hora de
 * Argentina, no la del servidor. Devuelve un Date (inválido si no se entiende).
 */
export function parseArgentinaDateTime(value) {
  if (value instanceof Date) return value
  const text = String(value).trim()
  if (HAS_TIME_ZONE.test(text) || !text.includes('T')) return new Date(text)
  // JS solo entiende hasta milisegundos
  const [date, time] = text.split('T')
  const [clock, fraction = '0'] = time.split('.')
  return new Date(`${date}T${clock}.${fraction.padEnd(3, '0').slice(0, 3)}-03:00`)
}

/** Fecha (d/m/aaaa) en la zona horaria de Buenos Aires, sin importar la del servidor. */
export function formatArgentinaDate(value) {
  return new Date(value).toLocaleDateString('es-AR', { timeZone: ARGENTINA_TIME_ZONE })
}
