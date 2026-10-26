import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import ResetPasswordForm from '../../components/organisms/ResetPasswordForm/ResetPasswordForm.jsx'
import { resetPassword } from '../../services/auth.service.js'
import { getApiErrorMessage } from '../../utils/apiErrors.js'
import '../../styles/auth-form.css'

// Página del link que llega por correo: /restablecer-contrasena?token=…
function RestablecerContrasena() {
  const [searchParams, setSearchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { status, logout } = useAuth()
  const [done, setDone] = useState(false)

  const handleSubmit = async (password) => {
    try {
      await resetPassword({ token, password })
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
    // El back cerró todas las sesiones: si había una abierta en esta pestaña, también se cierra
    if (status === 'authenticated') await logout().catch(() => {})
    setDone(true)
    // Ya usado, el token no sirve más: se saca de la URL para que no quede en el historial
    const next = new URLSearchParams(searchParams)
    next.delete('token')
    setSearchParams(next, { replace: true })
  }

  if (done) {
    return (
      <>
        <StepHeading title="Listo, cambiaste tu contraseña" />
        <div className="auth-form">
          <StatusMessage>
            Por seguridad cerramos las sesiones abiertas en otros dispositivos. Iniciá sesión con tu
            contraseña nueva.
          </StatusMessage>
          <Button to="/login" className="auth-form-submit">
            Iniciar sesión
          </Button>
        </div>
      </>
    )
  }

  if (!token) {
    return (
      <>
        <StepHeading title="Link inválido" />
        <div className="auth-form">
          <StatusMessage variant="error">
            Al link le falta una parte. Abrilo de nuevo desde el correo o pedí uno nuevo.
          </StatusMessage>
          <Button to="/recuperar-contrasena" className="auth-form-submit">
            Pedir un link nuevo
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <StepHeading title="Elegí una contraseña nueva" subtitle="La vas a usar para iniciar sesión en ProfitZone." />
      <ResetPasswordForm onSubmit={handleSubmit} />
    </>
  )
}

export default RestablecerContrasena
