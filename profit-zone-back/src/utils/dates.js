const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'
// Argentina no tiene horario de verano desde 2009
const ARGENTINA_OFFSET = '-03:00'
// Fecha y hora sin zona horaria: '2026-10-06T16:48:21.000359', '2026-10-06 16:48', '2026-10-06'
const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/

/**
 * Fecha de un dataset que puede venir sin zona horaria (ej. el scraped_at de
 * ZonaProp): sin zona se toma como hora de Argentina, no la del servidor. Con
 * zona (Z, -03:00…) se respeta. Devuelve un Date (inválido si no se entiende).
 */
export function parseArgentinaDateTime(value) {
  if (value instanceof Date) return value
  const text = String(value).trim()
  const match = LOCAL_DATE_TIME.exec(text)
  if (!match) return new Date(text)
  const [, date, hours = '00', minutes = '00', seconds = '00', fraction = '0'] = match
  // JS solo entiende hasta milisegundos
  const millis = fraction.padEnd(3, '0').slice(0, 3)
  return new Date(`${date}T${hours}:${minutes}:${seconds}.${millis}${ARGENTINA_OFFSET}`)
}

/** Fecha (d/m/aaaa) en la zona horaria de Buenos Aires, sin importar la del servidor. Null si no es válida. */
export function formatArgentinaDate(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return date.toLocaleDateString('es-AR', { timeZone: ARGENTINA_TIME_ZONE })
}
