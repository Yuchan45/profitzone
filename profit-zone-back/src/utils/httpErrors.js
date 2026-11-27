/**
 * Error esperado con su código HTTP: el errorHandler responde con ese status y el mensaje.
 * `code` (opcional) es un código estable para que el front distinga el caso sin leer el texto
 * (ej. INSUFFICIENT_CREDITS).
 */
export function httpError(status, message, code) {
  const error = new Error(message)
  error.status = status
  if (code) error.appCode = code
  return error
}
