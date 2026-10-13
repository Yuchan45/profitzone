import { Link } from 'react-router-dom'
import './Button.css'

// variant: 'primary' | 'secondary' | 'text' | 'danger' — size: 'l' | 'm'
// Con `to` se renderiza como <Link> de React Router; con `href` (links externos), como <a>;
// si no, como <button>.
function Button({
  variant = 'primary',
  size = 'l',
  to,
  href,
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

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button
