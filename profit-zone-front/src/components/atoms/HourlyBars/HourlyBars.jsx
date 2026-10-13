import './HourlyBars.css'

// Cada cuántas horas se rotula el eje (además de la primera y la última)
const LABEL_EVERY = 4

/**
 * Gráfico de barras de actividad por hora (0 a 100), con la franja del usuario destacada.
 * `hours`: [{ hour, label, value, isHighlighted }]. `summary` describe el gráfico para
 * lectores de pantalla.
 */
function HourlyBars({ hours, summary }) {
  // Por posición y no por hora: la franja puede cruzar la medianoche (ej. 22, 23, 0, 1)
  const showLabel = (index) => index === 0 || index === hours.length - 1 || index % LABEL_EVERY === 0

  return (
    <figure className="hourly-bars" role="img" aria-label={summary}>
      <div className="hourly-bars-plot">
        {hours.map(({ hour, value, isHighlighted }) => (
          <span
            key={hour}
            className={`hourly-bars-bar${isHighlighted ? ' hourly-bars-bar--highlighted' : ''}`}
            style={{ height: `${Math.max(value, 4)}%` }}
          />
        ))}
      </div>
      <div className="hourly-bars-axis" aria-hidden="true">
        {hours.map(({ hour, label }, index) => (
          <span key={hour} className="hourly-bars-label">
            {showLabel(index) ? label : ''}
          </span>
        ))}
      </div>
    </figure>
  )
}

export default HourlyBars
