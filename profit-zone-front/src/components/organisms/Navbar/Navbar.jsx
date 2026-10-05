import { Link, NavLink } from 'react-router-dom'
import Logo from '../../atoms/Logo/Logo.jsx'
import Button from '../../atoms/Button/Button.jsx'
import './Navbar.css'

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand" aria-label="ProfitZone, ir al inicio">
        <Logo size="s" />
      </Link>
      <nav className="navbar-links">
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </nav>
      <div className="navbar-actions">
        {/* Accesos de cuenta: mientras no haya auth real, conviven con "Mi perfil" (mock) */}
        <Button variant="text" size="m" to="/login">
          Iniciar sesión
        </Button>
        <Button variant="primary" size="m" to="/registro">
          Crear cuenta
        </Button>
        <NavLink to="/perfil" className="navbar-profile-btn">
          <span className="navbar-avatar">CM</span>
          <span>Mi perfil</span>
        </NavLink>
      </div>
    </header>
  )
}

export default Navbar
