import './Input.css'

// Campo de texto base. `invalid` marca el error visual y para lectores de pantalla.
function Input({ invalid = false, className = '', ...rest }) {
  return (
    <input
      className={`input${invalid ? ' input--invalid' : ''} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}

export default Input
