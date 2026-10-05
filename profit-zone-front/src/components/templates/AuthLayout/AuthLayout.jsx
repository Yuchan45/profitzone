import { Link, Outlet } from 'react-router-dom'
import AuthBrandPanel from '../../organisms/AuthBrandPanel/AuthBrandPanel.jsx'
import Logo from '../../atoms/Logo/Logo.jsx'
import './AuthLayout.css'

// Layout de registro e inicio de sesión: panel de marca a la izquierda y el formulario a la derecha.
function AuthLayout() {
  return (
    <div className="auth-shell">
      <AuthBrandPanel />
      <main className="auth-main">
        <div className="auth-main-inner">
          <Link to="/" className="auth-main-brand" aria-label="ProfitZone, ir al inicio">
            <Logo size="m" />
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
