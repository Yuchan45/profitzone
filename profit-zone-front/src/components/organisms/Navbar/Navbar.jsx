import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import Logo from '../../atoms/Logo/Logo.jsx'
import Button from '../../atoms/Button/Button.jsx'
import { getInitials } from '../../../utils/userDisplay.js'
import './Navbar.css'

function Navbar() {
  const { status, user, logout } = useAuth()

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" aria-label="ProfitZone, ir al inicio">
        <Logo size="s" />
      </Link>
      <nav className="navbar-links">
        <NavLink to="/">Inicio</NavLink>
        {status === 'authenticated' && <NavLink to="/dashboard">Dashboard</NavLink>}
      </nav>
      <div className="navbar-actions">
        {status === 'anonymous' && (
          <>
            <Button variant="text" size="m" to="/login">
              Iniciar sesión
            </Button>
            <Button variant="primary" size="m" to="/registro">
              Crear cuenta
            </Button>
          </>
        )}
        {status === 'authenticated' && (
          <>
            <Button variant="text" size="m" onClick={logout}>
              Cerrar sesión
            </Button>
            <NavLink to="/perfil" className="navbar-profile-btn">
              <span className="navbar-avatar" aria-hidden="true">
                {getInitials(user)}
              </span>
              <span>{user.firstName}</span>
            </NavLink>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
