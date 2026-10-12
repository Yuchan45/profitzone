import './StatTile.css'

// Dato de la zona: etiqueta, valor grande y una aclaración. Sin `value` se muestra
// como dato pendiente.
function StatTile({ label, value, caption }) {
  return (
    <div className={`stat-tile${value === undefined || value === null ? ' stat-tile--empty' : ''}`}>
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-value">{value ?? '—'}</span>
      {caption && <span className="stat-tile-caption">{caption}</span>}
    </div>
  )
}

export default StatTile
