import Icon from '../Icon/Icon.jsx'
import './Logo.css'

const ICON_SIZES = { m: 20, s: 18 }

function Logo({ size = 'm' }) {
  return (
    <span className={`logo logo--${size}`}>
      <span className="logo-mark">
        <Icon name="map-pin" size={ICON_SIZES[size]} strokeWidth={2.25} />
      </span>
      <span className="logo-text">ProfitZone</span>
    </span>
  )
}

export default Logo
