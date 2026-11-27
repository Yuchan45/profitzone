import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import Logo from '../../atoms/Logo/Logo.jsx'
import Button from '../../atoms/Button/Button.jsx'
import UserMenu from '../../molecules/UserMenu/UserMenu.jsx'
import { getInitials } from '../../../utils/userDisplay.js'
import { NEW_ANALYSIS_LINK } from '../../../utils/flowSteps.js'
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
        {status === 'authenticated' && (
          <NavLink to="/mis-reportes" className={({ isActive }) => `navbar-link navbar-link--reports${isActive ? ' navbar-link--active' : ''}`}>
            Mis reportes
          </NavLink>
        )}
        <Button variant="primary" size="m" {...NEW_ANALYSIS_LINK}>
          <span className="navbar-cta-full">Analizar una zona</span>
          <span className="navbar-cta-short">Analizar</span>
        </Button>
        {status === 'authenticated' && (
          <UserMenu initials={getInitials(user)} name={user.firstName} onLogout={logout} />
        )}
      </div>
    </header>
  )
}

export default Navbar
