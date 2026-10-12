import './Chip.css'

function Chip({ selected = false, onClick, children }) {
  return (
    <button
      type="button"
      className={`chip${selected ? ' chip--selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Chip
