import { Link } from 'react-router-dom'
import Icon from '../../atoms/Icon/Icon.jsx'
import './Stepper.css'

/**
 * `steps`: [{ label, to }]. Con `to` el paso es un link; sin `to` no hace nada
 * (por ejemplo, un paso siguiente que todavía no se puede alcanzar).
 * `current` es el número de paso activo (empieza en 1).
 */
function Stepper({ steps, current }) {
  return (
    <nav className="stepper" aria-label="Progreso del análisis">
      <ol className="stepper-list">
        {steps.map(({ label, to }, index) => {
          const number = index + 1
          const state =
            number < current ? 'done' : number === current ? 'active' : 'pending'

          const content = (
            <>
              <span className="stepper-number">
                {state === 'done' ? <Icon name="check" size={12} strokeWidth={3} /> : number}
              </span>
              <span className="stepper-label">{label}</span>
              {state === 'done' && <span className="stepper-sr-only"> (completado)</span>}
            </>
          )

          return (
            <li key={label} className={`stepper-step stepper-step--${state}`}>
              {to && state !== 'active' ? (
                <Link to={to} className="stepper-item stepper-item--link">
                  {content}
                </Link>
              ) : (
                <span
                  className="stepper-item"
                  aria-current={state === 'active' ? 'step' : undefined}
                  aria-disabled={state === 'active' ? undefined : true}
                >
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Stepper
