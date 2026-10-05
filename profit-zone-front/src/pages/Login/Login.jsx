import { useState } from 'react'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import SegmentedNav from '../../components/molecules/SegmentedNav/SegmentedNav.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import LoginForm from '../../components/organisms/LoginForm/LoginForm.jsx'
import { AUTH_TABS } from '../../utils/authTabs.js'

function Login() {
  const [submitted, setSubmitted] = useState(false)

  // Todavía no hay endpoint de login en el back: el formulario valida y avisa.
  const handleSubmit = () => {
    setSubmitted(true)
  }

  return (
    <>
      <StepHeading
        title="Iniciar sesión"
        subtitle="Ingresá para ver tus análisis guardados en Mis reportes."
      />
      <SegmentedNav items={AUTH_TABS} label="Registro o inicio de sesión" />
      {submitted && (
        <StatusMessage>
          Tus datos están bien. El inicio de sesión todavía no está conectado con el servidor.
        </StatusMessage>
      )}
      <LoginForm onSubmit={handleSubmit} />
    </>
  )
}

export default Login
