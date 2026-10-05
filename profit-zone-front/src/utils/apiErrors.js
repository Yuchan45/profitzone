// Convierte un error de Axios en un mensaje legible para mostrar en la UI.
export function getApiErrorMessage(error, fallback = 'Algo salió mal. Probá de nuevo.') {
  if (!error.response) return 'No pudimos conectarnos con el servidor. Revisá tu conexión.'
  return error.response.data?.message ?? fallback
}

/**
 * Error de registro o inicio de sesión listo para RegisterForm/LoginForm: si el
 * correo ya existe (409), el mensaje se marca en el campo de correo.
 */
export function toAuthFormError(error) {
  const message = getApiErrorMessage(error)
  if (error.response?.status === 409) {
    return Object.assign(new Error(message), { fieldErrors: { email: message } })
  }
  return new Error(message)
}
