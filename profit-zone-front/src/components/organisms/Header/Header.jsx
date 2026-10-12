import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import Logo from '../../atoms/Logo/Logo.jsx'
import Button from '../../atoms/Button/Button.jsx'
import UserMenu from '../../molecules/UserMenu/UserMenu.jsx'
import { getInitials } from '../../../utils/userDisplay.js'
import './Header.css'

// Header del flujo de análisis: sin sesión, "Iniciar sesión"; con sesión, el menú del usuario.
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
        <UserMenu initials={getInitials(user)} name={user.firstName} onLogout={logout} />
      )}
    </header>
  )
}

export default Header
