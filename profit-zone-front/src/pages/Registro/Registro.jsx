import { useState } from 'react'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import SegmentedNav from '../../components/molecules/SegmentedNav/SegmentedNav.jsx'
import StatusMessage from '../../components/molecules/StatusMessage/StatusMessage.jsx'
import RegisterForm from '../../components/organisms/RegisterForm/RegisterForm.jsx'
import { AUTH_TABS } from '../../utils/authTabs.js'

function Registro() {
  const [submitted, setSubmitted] = useState(false)

  // Todavía no hay endpoint de registro en el back: el formulario valida y avisa.
  const handleSubmit = () => {
    setSubmitted(true)
  }

  return (
    <>
      <StepHeading
        title="Registro"
        subtitle="Creá tu cuenta para guardar tus análisis y volver a verlos en Mis reportes."
      />
      <SegmentedNav items={AUTH_TABS} label="Registro o inicio de sesión" />
      {submitted && (
        <StatusMessage>
          Tus datos están bien. El registro todavía no está conectado con el servidor.
        </StatusMessage>
      )}
      <RegisterForm onSubmit={handleSubmit} />
    </>
  )
}

export default Registro
