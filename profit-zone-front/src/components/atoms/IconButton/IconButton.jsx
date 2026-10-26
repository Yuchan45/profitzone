import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'
import './IconButton.css'

/**
 * Botón con solo un ícono. `label` es el nombre accesible y el tooltip que aparece
 * arriba al pasar el mouse o al enfocarlo con teclado. Con `to` se renderiza como
 * <Link> de React Router; si no, como <button>.
 */
function IconButton({ icon, label, iconSize = 16, to, type = 'button', className = '', ...rest }) {
  const props = {
    className: `icon-button ${className}`.trim(),
    'aria-label': label,
    'data-tooltip': label,
    ...rest,
  }

  if (to) {
    return (
      <Link to={to} {...props}>
        <Icon name={icon} size={iconSize} />
      </Link>
    )
  }

  return (
    <button type={type} {...props}>
      <Icon name={icon} size={iconSize} />
    </button>
  )
}

export default IconButton
