import { NavLink } from 'react-router-dom'
import './SegmentedNav.css'

// Control segmentado. Por defecto cada opción es una ruta (ej. /registro y /login).
// Con `value` y `onChange` funciona como pestañas sin cambiar de ruta (ej. en un modal):
// cada item lleva `value` en vez de `to`.
function SegmentedNav({ items, label, value, onChange }) {
  if (onChange) {
    return (
      <div className="segmented-nav" role="tablist" aria-label={label}>
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === value}
            className={`segmented-nav-item${item.value === value ? ' active' : ''}`}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    )
  }

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
