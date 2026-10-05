import { NavLink } from 'react-router-dom'
import './SegmentedNav.css'

// Control segmentado de navegación: cada opción es una ruta (ej. Crear cuenta / Iniciar sesión).
function SegmentedNav({ items, label }) {
  return (
    <nav className="segmented-nav" aria-label={label}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className="segmented-nav-item" replace>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default SegmentedNav
