import { useState } from 'react'
import FormField from '../../molecules/FormField/FormField.jsx'
import PasswordInput from '../../molecules/PasswordInput/PasswordInput.jsx'
import StatusMessage from '../../molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../atoms/Button/Button.jsx'
import {
  PASSWORD_MIN_LENGTH,
  validateNewPassword,
  validatePasswordConfirmation,
} from '../../../utils/validators.js'
import '../../../styles/auth-form.css'

const INITIAL_VALUES = { password: '', confirmation: '' }
const FIELD_ORDER = ['password', 'confirmation']

function validate(values) {
  const errors = {
    password: validateNewPassword(values.password),
    confirmation: validatePasswordConfirmation(values.password, values.confirmation),
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

/**
 * Formulario para elegir la contraseña nueva. `onSubmit(password)` devuelve una
 * promesa; si falla, su `message` se muestra arriba del formulario.
 */
function ResetPasswordForm({ onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormError(null)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(`reset-${firstInvalid}`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(values.password)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const describedBy = (field) => (errors[field] ? `reset-${field}-error` : undefined)

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && <StatusMessage variant="error">{formError}</StatusMessage>}

      <FormField id="reset-password" label="Contraseña nueva" error={errors.password}>
        <PasswordInput
          id="reset-password"
          name="password"
          autoComplete="new-password"
          placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
          value={values.password}
          onChange={handleChange}
          invalid={Boolean(errors.password)}
          aria-describedby={describedBy('password')}
        />
      </FormField>

      <FormField id="reset-confirmation" label="Repetí la contraseña" error={errors.confirmation}>
        <PasswordInput
          id="reset-confirmation"
          name="confirmation"
          autoComplete="new-password"
          placeholder="La misma contraseña"
          value={values.confirmation}
          onChange={handleChange}
          invalid={Boolean(errors.confirmation)}
          aria-describedby={describedBy('confirmation')}
        />
      </FormField>

      <Button type="submit" className="auth-form-submit" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Guardar contraseña'}
      </Button>
    </form>
  )
}

export default ResetPasswordForm
