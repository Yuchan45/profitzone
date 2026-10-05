import IconTile from '../../atoms/IconTile/IconTile.jsx'
import './CategoryCard.css'

function CategoryCard({ icon, title, description, selected = false, onSelect }) {
  return (
    <button
      type="button"
      className={`category-card${selected ? ' category-card--selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <IconTile icon={icon} size="l" variant={selected ? 'solid' : 'neutral'} />
      <span className="category-card-title">{title}</span>
      <span className="category-card-description">{description}</span>
    </button>
  )
}

export default CategoryCard
