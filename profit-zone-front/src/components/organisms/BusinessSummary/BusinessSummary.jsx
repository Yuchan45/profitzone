import { Link } from 'react-router-dom'
import './BusinessSummary.css'

// Panel "Tu negocio": resumen de lo que respondió el usuario, con link para editarlo.
// rows: [{ label, value }]. layout: 'panel' (una fila por respuesta) | 'inline' (una
// sola línea con los valores, como en el paso 4).
function BusinessSummary({ rows, editTo, layout = 'panel' }) {
  if (layout === 'inline') {
    return (
      <section className="business-summary business-summary--inline" aria-label="Tu negocio">
        <p className="business-summary-line">Tu negocio: {rows.map(({ value }) => value).join(' · ')}</p>
        {editTo && (
          <Link to={editTo} className="business-summary-edit">
            Editar respuestas
          </Link>
        )}
      </section>
    )
  }

  return (
    <section className="business-summary" aria-labelledby="business-summary-title">
      <div className="business-summary-header">
        <h2 id="business-summary-title" className="business-summary-title">
          Tu negocio
        </h2>
        {editTo && (
          <Link to={editTo} className="business-summary-edit">
            Editar
          </Link>
        )}
      </div>
      <dl className="business-summary-list">
        {rows.map(({ label, value }) => (
          <div key={label} className="business-summary-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default BusinessSummary
