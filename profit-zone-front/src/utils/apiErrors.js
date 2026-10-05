// Convierte un error de Axios en un mensaje legible para mostrar en la UI.
export function getApiErrorMessage(error, fallback = 'Algo salió mal. Probá de nuevo.') {
  if (!error.response) return 'No pudimos conectarnos con el servidor. Revisá tu conexión.'
  return error.response.data?.message ?? fallback
}
