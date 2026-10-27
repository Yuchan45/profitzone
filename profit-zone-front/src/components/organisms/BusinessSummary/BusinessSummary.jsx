import { Link } from 'react-router-dom'
import './BusinessSummary.css'

// Panel "Tu negocio": resumen de lo que respondió el usuario, con link para editarlo.
// rows: [{ label, value }]. layout: 'panel' (una fila por respuesta) | 'inline' (franja
// compacta con cada respuesta y su etiqueta, como en el paso 4). `title`: otro nombre
// para el panel (ej. en el reporte de ejemplo, que no es el negocio del usuario).
function BusinessSummary({ rows, editTo, layout = 'panel', title = 'Tu negocio' }) {
  if (layout === 'inline') {
    return (
      <section className="business-summary business-summary--inline" aria-label={title}>
        <div className="business-summary-inline">
          <h2 className="business-summary-inline-title">{title}</h2>
          <dl className="business-summary-inline-list">
            {rows.map(({ label, value }) => (
              <div key={label} className="business-summary-inline-item">
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
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
          {title}
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
