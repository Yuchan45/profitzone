import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import SegmentedNav from '../../components/molecules/SegmentedNav/SegmentedNav.jsx'
import RegisterForm from '../../components/organisms/RegisterForm/RegisterForm.jsx'
import { AUTH_TABS } from '../../utils/authTabs.js'
import { toAuthFormError } from '../../utils/apiErrors.js'

function Registro() {
  const { status, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // A dónde volver después de registrarse (lo deja ProtectedRoute)
  const from = location.state?.from ?? '/'

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (values) => {
    try {
      await register(values)
      navigate(from, { replace: true })
    } catch (error) {
      // Correo ya registrado: se marca en el campo
      throw toAuthFormError(error)
    }
  }

  return (
    <>
      <StepHeading
        title="Registro"
        subtitle="Creá tu cuenta para guardar tus análisis y volver a verlos en Mis reportes."
      />
      <SegmentedNav items={AUTH_TABS} label="Registro o inicio de sesión" />
      <RegisterForm onSubmit={handleSubmit} />
    </>
  )
}

export default Registro
