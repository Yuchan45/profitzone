import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import Logo from '../../atoms/Logo/Logo.jsx'
import Button from '../../atoms/Button/Button.jsx'
import UserMenu from '../../molecules/UserMenu/UserMenu.jsx'
import { getInitials } from '../../../utils/userDisplay.js'
import './Navbar.css'

function Navbar() {
  const { status, user, logout } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" aria-label="ProfitZone, ir al inicio">
        <Logo size="s" />
      </Link>
      <div className="navbar-actions">
        {status === 'anonymous' && (
          <Button variant="text" size="m" to="/login">
            Iniciar sesión
          </Button>
        )}
        <Button variant="primary" size="m" to="/analizar/rubro">
          Analizar una zona
        </Button>
        {status === 'authenticated' && (
          <UserMenu initials={getInitials(user)} name={user.firstName} onLogout={logout} />
        )}
      </div>
    </header>
  )
}

export default Navbar
