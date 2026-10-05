import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import StepHeading from '../../components/molecules/StepHeading/StepHeading.jsx'
import SegmentedNav from '../../components/molecules/SegmentedNav/SegmentedNav.jsx'
import LoginForm from '../../components/organisms/LoginForm/LoginForm.jsx'
import { AUTH_TABS } from '../../utils/authTabs.js'
import { getApiErrorMessage } from '../../utils/apiErrors.js'

function Login() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // A dónde volver después de iniciar sesión (lo deja ProtectedRoute)
  const from = location.state?.from ?? '/'

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (values) => {
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (error) {
      throw new Error(getApiErrorMessage(error))
    }
  }

  return (
    <>
      <StepHeading
        title="Iniciar sesión"
        subtitle="Ingresá para ver tus análisis guardados en Mis reportes."
      />
      <SegmentedNav items={AUTH_TABS} label="Registro o inicio de sesión" />
      <LoginForm onSubmit={handleSubmit} />
    </>
  )
}

export default Login
