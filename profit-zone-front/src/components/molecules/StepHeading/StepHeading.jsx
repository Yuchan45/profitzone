import './StepHeading.css'

// `eyebrow`: texto chico opcional arriba del título (ej. "Parte 1 de 2").
function StepHeading({ eyebrow, title, subtitle }) {
  return (
    <header className="step-heading">
      {eyebrow && <p className="step-heading-eyebrow">{eyebrow}</p>}
      <h1 className="step-heading-title">{title}</h1>
      {subtitle && <p className="step-heading-subtitle">{subtitle}</p>}
    </header>
  )
}

export default StepHeading
