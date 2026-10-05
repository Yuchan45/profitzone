import { Link } from 'react-router-dom'
import Logo from '../../atoms/Logo/Logo.jsx'
import Button from '../../atoms/Button/Button.jsx'
import './Header.css'

// Header del flujo de análisis.
function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-brand" aria-label="ProfitZone, ir al inicio">
        <Logo size="m" />
      </Link>
      <Button variant="text" size="m" to="/login">
        Iniciar sesión
      </Button>
    </header>
  )
}

export default Header
