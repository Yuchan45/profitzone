import { Link } from 'react-router-dom'
import './BusinessSummary.css'

// Panel "Tu negocio": resumen de lo que respondió el usuario, con link para editarlo.
// rows: [{ label, value }]
function BusinessSummary({ rows, editTo }) {
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
