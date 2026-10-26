import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../../molecules/FormField/FormField.jsx'
import StatusMessage from '../../molecules/StatusMessage/StatusMessage.jsx'
import Input from '../../atoms/Input/Input.jsx'
import Button from '../../atoms/Button/Button.jsx'
import { validateEmail } from '../../../utils/validators.js'
import '../../../styles/auth-form.css'

/**
 * Formulario para pedir el link de recuperación. `onSubmit(email)` devuelve una
 * promesa; si falla, su `message` se muestra arriba del formulario.
 */
function ForgotPasswordForm({ onSubmit }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    setEmail(event.target.value)
    if (error) setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextError = validateEmail(email)
    setError(nextError)
    setFormError(null)

    if (nextError) {
      document.getElementById('forgot-email')?.focus()
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(email.trim())
    } catch (submitError) {
      setFormError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && <StatusMessage variant="error">{formError}</StatusMessage>}

      <FormField id="forgot-email" label="Correo electrónico" error={error}>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={handleChange}
          invalid={Boolean(error)}
          aria-describedby={error ? 'forgot-email-error' : undefined}
        />
      </FormField>

      <Button type="submit" className="auth-form-submit" disabled={submitting}>
        {submitting ? 'Enviando…' : 'Enviarme el link'}
      </Button>

      <p className="auth-form-switch">
        ¿Te acordaste? <Link to="/login">Iniciá sesión</Link>
      </p>
    </form>
  )
}

export default ForgotPasswordForm
