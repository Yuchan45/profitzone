/** Error esperado con su código HTTP: el errorHandler responde con ese status y el mensaje. */
export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}
