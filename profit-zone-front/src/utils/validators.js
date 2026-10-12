// Validaciones de formularios del front. Los mensajes se muestran tal cual al usuario.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PASSWORD_MIN_LENGTH = 8

export function validateEmail(value) {
  if (!value.trim()) return 'Ingresá tu correo electrónico.'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Ingresá un correo válido, por ejemplo tu@correo.com.'
  return null
}

export function validateNewPassword(value) {
  if (!value) return 'Ingresá una contraseña.'
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña tiene que tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }
  return null
}

export function validateRequired(value, message) {
  return value.trim() ? null : message
}
