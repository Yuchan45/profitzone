import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../../molecules/FormField/FormField.jsx'
import PasswordInput from '../../molecules/PasswordInput/PasswordInput.jsx'
import StatusMessage from '../../molecules/StatusMessage/StatusMessage.jsx'
import Input from '../../atoms/Input/Input.jsx'
import Checkbox from '../../atoms/Checkbox/Checkbox.jsx'
import Button from '../../atoms/Button/Button.jsx'
import Divider from '../../atoms/Divider/Divider.jsx'
import GoogleLogo from '../../atoms/GoogleLogo/GoogleLogo.jsx'
import {
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateNewPassword,
  validateRequired,
} from '../../../utils/validators.js'
import '../../../styles/auth-form.css'

const INITIAL_VALUES = { firstName: '', lastName: '', email: '', password: '', acceptTerms: false }

// Orden en que se enfoca el primer campo con error al enviar
const FIELD_ORDER = ['firstName', 'lastName', 'email', 'password', 'acceptTerms']

function validate(values) {
  const errors = {
    firstName: validateRequired(values.firstName, 'Ingresá tu nombre.'),
    lastName: validateRequired(values.lastName, 'Ingresá tu apellido.'),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    acceptTerms: values.acceptTerms ? null : 'Tenés que aceptar los términos para crear la cuenta.',
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

function focusField(field) {
  document.getElementById(`register-${field}`)?.focus()
}

/**
 * Formulario de registro. `onSubmit(values)` devuelve una promesa; si falla con
 * `{ fieldErrors }` se marcan esos campos, y con `{ message }` se muestra arriba.
 */
// `onSwitchToLogin` opcional: dentro de un modal cambia de pestaña en vez de ir a /login.
function RegisterForm({ onSubmit, onSwitchToLogin }) {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    // El error de un campo se limpia apenas el usuario lo corrige
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setFormError(null)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      focusField(firstInvalid)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      })
    } catch (error) {
      if (error.fieldErrors) {
        setErrors(error.fieldErrors)
        focusField(FIELD_ORDER.find((field) => error.fieldErrors[field]))
      } else {
        setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const describedBy = (field) => (errors[field] ? `register-${field}-error` : undefined)

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {formError && <StatusMessage variant="error">{formError}</StatusMessage>}

      <div className="auth-form-row">
        <FormField id="register-firstName" label="Nombre" error={errors.firstName}>
          <Input
            id="register-firstName"
            name="firstName"
            autoComplete="given-name"
            placeholder="Carlos"
            value={values.firstName}
            onChange={handleChange}
            invalid={Boolean(errors.firstName)}
            aria-describedby={describedBy('firstName')}
          />
        </FormField>

        <FormField id="register-lastName" label="Apellido" error={errors.lastName}>
          <Input
            id="register-lastName"
            name="lastName"
            autoComplete="family-name"
            placeholder="Mendoza"
            value={values.lastName}
            onChange={handleChange}
            invalid={Boolean(errors.lastName)}
            aria-describedby={describedBy('lastName')}
          />
        </FormField>
      </div>

      <FormField id="register-email" label="Correo electrónico" error={errors.email}>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@correo.com"
          value={values.email}
          onChange={handleChange}
          invalid={Boolean(errors.email)}
          aria-describedby={describedBy('email')}
        />
      </FormField>

      <FormField id="register-password" label="Contraseña" error={errors.password}>
        <PasswordInput
          id="register-password"
          name="password"
          autoComplete="new-password"
          placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
          value={values.password}
          onChange={handleChange}
          invalid={Boolean(errors.password)}
          aria-describedby={describedBy('password')}
        />
      </FormField>

      <div className="auth-form-terms">
        <Checkbox
          id="register-acceptTerms"
          name="acceptTerms"
          checked={values.acceptTerms}
          onChange={handleChange}
          invalid={Boolean(errors.acceptTerms)}
          aria-describedby={describedBy('acceptTerms')}
        >
          Acepto los términos y la política de privacidad
        </Checkbox>
        {errors.acceptTerms && (
          <p id="register-acceptTerms-error" className="auth-form-error">
            {errors.acceptTerms}
          </p>
        )}
      </div>

      <Button type="submit" className="auth-form-submit" disabled={submitting}>
        {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>

      <Divider label="o" />

      {/* Todavía no hay login con Google: se muestra deshabilitado */}
      <Button variant="secondary" className="auth-form-google" disabled title="Próximamente">
        <GoogleLogo />
        Continuar con Google
      </Button>

      <p className="auth-form-switch">
        ¿Ya tenés cuenta?{' '}
        {onSwitchToLogin ? (
          <button type="button" className="auth-form-switch-button" onClick={onSwitchToLogin}>
            Iniciá sesión
          </button>
        ) : (
          <Link to="/login">Iniciá sesión</Link>
        )}
      </p>
    </form>
  )
}

export default RegisterForm
