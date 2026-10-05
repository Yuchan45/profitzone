import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../../molecules/FormField/FormField.jsx'
import PasswordInput from '../../molecules/PasswordInput/PasswordInput.jsx'
import Input from '../../atoms/Input/Input.jsx'
import Button from '../../atoms/Button/Button.jsx'
import Divider from '../../atoms/Divider/Divider.jsx'
import GoogleLogo from '../../atoms/GoogleLogo/GoogleLogo.jsx'
import { validateEmail, validateRequired } from '../../../utils/validators.js'
import '../../../styles/auth-form.css'

const INITIAL_VALUES = { email: '', password: '' }
const FIELD_ORDER = ['email', 'password']

function validate(values) {
  const errors = {
    email: validateEmail(values.email),
    // En el login no se valida el largo: eso lo decide el back
    password: validateRequired(values.password, 'Ingresá tu contraseña.'),
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

/** Formulario de inicio de sesión. `onSubmit` recibe los valores ya validados. */
function LoginForm({ onSubmit }) {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(`login-${firstInvalid}`)?.focus()
      return
    }
    onSubmit({ ...values, email: values.email.trim() })
  }

  const describedBy = (field) => (errors[field] ? `login-${field}-error` : undefined)

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <FormField id="login-email" label="Correo electrónico" error={errors.email}>
        <Input
          id="login-email"
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

      <FormField id="login-password" label="Contraseña" error={errors.password}>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={values.password}
          onChange={handleChange}
          invalid={Boolean(errors.password)}
          aria-describedby={describedBy('password')}
        />
      </FormField>

      <Button type="submit" className="auth-form-submit">
        Iniciar sesión
      </Button>

      <Divider label="o" />

      {/* Todavía no hay login con Google: se muestra deshabilitado */}
      <Button variant="secondary" className="auth-form-google" disabled title="Próximamente">
        <GoogleLogo />
        Continuar con Google
      </Button>

      <p className="auth-form-switch">
        ¿No tenés cuenta? <Link to="/registro">Creá una</Link>
      </p>
    </form>
  )
}

export default LoginForm
