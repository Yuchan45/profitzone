import Icon from '../../atoms/Icon/Icon.jsx'
import './Stepper.css'

// `current` es el número de paso activo (empieza en 1).
function Stepper({ steps, current }) {
  return (
    <nav className="stepper" aria-label="Progreso del análisis">
      <ol className="stepper-list">
        {steps.map((label, index) => {
          const number = index + 1
          const state =
            number < current ? 'done' : number === current ? 'active' : 'pending'

          return (
            <li
              key={label}
              className={`stepper-step stepper-step--${state}`}
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <span className="stepper-number">
                {state === 'done' ? <Icon name="check" size={12} strokeWidth={3} /> : number}
              </span>
              <span className="stepper-label">{label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Stepper
