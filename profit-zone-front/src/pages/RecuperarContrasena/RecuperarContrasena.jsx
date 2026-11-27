import { useState } from 'react'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import Button from '../../components/atoms/Button/Button.jsx'
import ForgotPasswordForm from '../../components/organisms/ForgotPasswordForm/ForgotPasswordForm.jsx'
import { useRequestPasswordReset } from '../../hooks/useRequestPasswordReset.js'
import '../../styles/auth-form.css'

function RecuperarContrasena() {
  const [sentTo, setSentTo] = useState(null)
  const requestReset = useRequestPasswordReset()

  const handleSubmit = async (email) => {
    await requestReset(email)
    setSentTo(email)
  }

  if (sentTo) {
    return (
      <>
        <StepHeading title="Revisá tu correo" />
        <div className="auth-form">
          {/* El back responde lo mismo exista o no la cuenta: el texto no lo confirma */}
          <StatusMessage>
            Si {sentTo} corresponde a una cuenta de ProfitZone, te mandamos un link para elegir una
            contraseña nueva. Vence en 30 minutos. Si no lo ves, revisá la carpeta de spam.
          </StatusMessage>
          <Button to="/login" className="auth-form-submit">
            Volver a iniciar sesión
          </Button>
          <p className="auth-form-switch">
            ¿No te llegó?{' '}
            <button type="button" className="auth-form-switch-button" onClick={() => setSentTo(null)}>
              Pedí otro link
            </button>
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <StepHeading
        title="Recuperar contraseña"
        subtitle="Ingresá el correo de tu cuenta y te mandamos un link para elegir una contraseña nueva."
      />
      <ForgotPasswordForm onSubmit={handleSubmit} />
    </>
  )
}

export default RecuperarContrasena
