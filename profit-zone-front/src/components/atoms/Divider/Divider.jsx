import './Divider.css'

// Línea horizontal, opcionalmente con un texto al medio (ej. "o").
function Divider({ label }) {
  return (
    <div className="divider" role="separator">
      {label && <span className="divider-label">{label}</span>}
    </div>
  )
}

export default Divider
