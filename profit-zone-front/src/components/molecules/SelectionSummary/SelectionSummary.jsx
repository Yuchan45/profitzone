import { Link } from 'react-router-dom'
import './SelectionSummary.css'

/** Píldora con una elección previa (ej. "Gastronomía · Cafetería") y un link para cambiarla. */
function SelectionSummary({ label, actionLabel = 'Cambiar', actionTo }) {
  return (
    <p className="selection-summary">
      <span className="selection-summary-label">{label}</span>
      {actionTo && (
        <Link to={actionTo} className="selection-summary-action">
          {actionLabel}
        </Link>
      )}
    </p>
  )
}

export default SelectionSummary
