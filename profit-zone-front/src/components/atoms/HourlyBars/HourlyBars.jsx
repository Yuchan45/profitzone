import './HourlyBars.css'

// Cada cuántas horas se rotula el eje (además de la primera y la última)
const LABEL_EVERY = 4

/**
 * Gráfico de barras de actividad por hora (0 a 100), con la franja del usuario destacada.
 * `hours`: [{ hour, label, value, isHighlighted }]. `summary` describe el gráfico para
 * lectores de pantalla.
 */
function HourlyBars({ hours, summary }) {
  const first = hours[0]?.hour
  const last = hours.at(-1)?.hour

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
        {hours.map(({ hour, label }) => (
          <span key={hour} className="hourly-bars-label">
            {hour === first || hour === last || (hour - first) % LABEL_EVERY === 0 ? label : ''}
          </span>
        ))}
      </div>
    </figure>
  )
}

export default HourlyBars
