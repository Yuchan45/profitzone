import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../../molecules/FormField/FormField.jsx'
import PasswordInput from '../../molecules/PasswordInput/PasswordInput.jsx'
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

const INITIAL_VALUES = { fullName: '', email: '', password: '', acceptTerms: false }

// Orden en que se enfoca el primer campo con error al enviar
const FIELD_ORDER = ['fullName', 'email', 'password', 'acceptTerms']

function validate(values) {
  const errors = {
    fullName: validateRequired(values.fullName, 'Ingresá tu nombre y apellido.'),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    acceptTerms: values.acceptTerms ? null : 'Tenés que aceptar los términos para crear la cuenta.',
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

/** Formulario de registro. `onSubmit` recibe los valores ya validados. */
function RegisterForm({ onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    // El error de un campo se limpia apenas el usuario lo corrige
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus()
      return
    }
    onSubmit({ ...values, fullName: values.fullName.trim(), email: values.email.trim() })
  }

  const describedBy = (field) => (errors[field] ? `register-${field}-error` : undefined)

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <FormField id="register-fullName" label="Nombre y apellido" error={errors.fullName}>
        <Input
          id="register-fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Carlos Mendoza"
          value={values.fullName}
          onChange={handleChange}
          invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy('fullName')}
        />
      </FormField>

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

      <Button type="submit" className="auth-form-submit">
        Crear cuenta
      </Button>

      <Divider label="o" />

      {/* Todavía no hay login con Google: se muestra deshabilitado */}
      <Button variant="secondary" className="auth-form-google" disabled title="Próximamente">
        <GoogleLogo />
        Continuar con Google
      </Button>

      <p className="auth-form-switch">
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </form>
  )
}

export default RegisterForm
