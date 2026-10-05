import { Link } from 'react-router-dom'
import Logo from '../../atoms/Logo/Logo.jsx'
import MapBackdrop from '../../atoms/MapBackdrop/MapBackdrop.jsx'
import './AuthBrandPanel.css'

// Panel de marca de las pantallas de registro e inicio de sesión (columna izquierda):
// mapa ilustrado de fondo, overlay oscuro y el texto encima.
function AuthBrandPanel() {
  return (
    <aside className="auth-brand">
      <div className="auth-brand-map">
        <MapBackdrop />
      </div>
      <div className="auth-brand-overlay" />

      <Link to="/" className="auth-brand-home" aria-label="ProfitZone, ir al inicio">
        <Logo variant="mark" size="l" />
      </Link>

      <div className="auth-brand-content">
        <h2 className="auth-brand-title">Evaluá una ubicación antes de abrir tu negocio</h2>
        <p className="auth-brand-text">
          Competencia, alquiler, afluencia, demografía y accesibilidad de la zona, cruzados con el
          perfil de tu emprendimiento. Guardá tus análisis y volvé a verlos cuando quieras.
        </p>
      </div>

      <p className="auth-brand-footer">© {new Date().getFullYear()} ProfitZone. Todos los derechos reservados.</p>
    </aside>
  )
}

export default AuthBrandPanel
