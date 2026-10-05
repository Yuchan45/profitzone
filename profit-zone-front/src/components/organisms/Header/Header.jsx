import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import Logo from '../../atoms/Logo/Logo.jsx'
import Button from '../../atoms/Button/Button.jsx'
import './Header.css'

// Header del flujo de análisis.
function Header() {
  const { status, user, logout } = useAuth()

  return (
    <header className="header">
      <Link to="/" className="header-brand" aria-label="ProfitZone, ir al inicio">
        <Logo size="m" />
      </Link>
      {status === 'anonymous' && (
        <Button variant="text" size="m" to="/login">
          Iniciar sesión
        </Button>
      )}
      {status === 'authenticated' && (
        <div className="header-session">
          <span className="header-user">Hola, {user.firstName}</span>
          <Button variant="text" size="m" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      )}
    </header>
  )
}

export default Header
