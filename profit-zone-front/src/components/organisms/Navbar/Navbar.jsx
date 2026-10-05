import { NavLink } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <header className="navbar">
      <span className="navbar-brand">ProfitZone</span>
      <nav className="navbar-links">
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </nav>
      <NavLink to="/perfil" className="navbar-profile-btn">
        <span className="navbar-avatar">CM</span>
        <span>Mi perfil</span>
      </NavLink>
    </header>
  )
}

export default Navbar
