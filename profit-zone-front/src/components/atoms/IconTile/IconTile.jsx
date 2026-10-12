import Icon from '../Icon/Icon.jsx'
import './IconTile.css'

const ICON_SIZES = { m: 18, l: 22 }

// variant: 'tint' | 'solid' | 'neutral' | 'circular' — size: 'm' | 'l'
function IconTile({ icon, size = 'l', variant = 'tint' }) {
  return (
    <span className={`icon-tile icon-tile--${size} icon-tile--${variant}`}>
      <Icon name={icon} size={ICON_SIZES[size]} />
    </span>
  )
}

export default IconTile
