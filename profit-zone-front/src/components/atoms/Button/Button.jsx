import { Link } from 'react-router-dom'
import './Button.css'

// variant: 'primary' | 'secondary' | 'text' | 'danger' — size: 'l' | 'm'
// Con `to` se renderiza como <Link> de React Router; si no, como <button>.
function Button({
  variant = 'primary',
  size = 'l',
  to,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = `btn btn--${variant} btn--${size} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
