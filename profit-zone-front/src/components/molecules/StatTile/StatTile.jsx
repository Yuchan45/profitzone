import './StatTile.css'

// Dato de la zona: etiqueta, valor grande y una aclaración. Sin `value` se muestra
// como dato pendiente. Con `onClick` es un botón (ej. lleva a la tarjeta con el detalle).
function StatTile({ label, value, caption, onClick }) {
  const Root = onClick ? 'button' : 'div'
  const empty = value === undefined || value === null

  return (
    <Root
      type={onClick ? 'button' : undefined}
      className={`stat-tile${empty ? ' stat-tile--empty' : ''}${onClick ? ' stat-tile--action' : ''}`}
      onClick={onClick}
    >
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-value">{value ?? '—'}</span>
      {caption && <span className="stat-tile-caption">{caption}</span>}
    </Root>
  )
}

export default StatTile
