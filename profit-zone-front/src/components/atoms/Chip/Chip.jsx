import './Chip.css'

// size: 'm' (por defecto) | 's' (compacto, para filtros dentro de una tarjeta)
function Chip({ selected = false, size = 'm', onClick, children }) {
  return (
    <button
      type="button"
      className={`chip${size === 's' ? ' chip--s' : ''}${selected ? ' chip--selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Chip
