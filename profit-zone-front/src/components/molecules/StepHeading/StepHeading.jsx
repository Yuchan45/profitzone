import SegmentedProgress from '../../atoms/SegmentedProgress/SegmentedProgress.jsx'
import './StepHeading.css'

// `part` opcional ({ current, total }): para pasos divididos en partes, muestra
// "Parte X de Y" con una barra de progreso arriba del título.
// `heading` opcional reemplaza al <h1> (ej. un nombre editable, que incluye su propio
// <h1>: un formulario no puede ir adentro de un título).
function StepHeading({ part, title, heading, subtitle }) {
  return (
    <header className="step-heading">
      {part && (
        <div className="step-heading-part">
          <span className="step-heading-part-label">
            Parte {part.current} de {part.total}
          </span>
          <SegmentedProgress current={part.current} total={part.total} />
        </div>
      )}
      {heading ?? <h1 className="step-heading-title">{title}</h1>}
      {subtitle && <p className="step-heading-subtitle">{subtitle}</p>}
    </header>
  )
}

export default StepHeading
