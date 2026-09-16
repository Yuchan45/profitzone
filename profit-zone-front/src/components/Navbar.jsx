import { NavLink } from 'react-router-dom'

function Navbar() {
  return (
    <header className="navbar">
      <span className="navbar-brand">ProfitZone</span>
      <nav className="navbar-links">
        <NavLink to="/">Inicio</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </nav>
    </header>
  )
}

export default Navbar
