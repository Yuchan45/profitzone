import Icon from '../Icon/Icon.jsx'
import './Checkbox.css'

// Checkbox nativo (accesible por teclado) con la caja dibujada por CSS.
function Checkbox({ invalid = false, children, ...rest }) {
  return (
    <label className={`checkbox${invalid ? ' checkbox--invalid' : ''}`}>
      <input
        type="checkbox"
        className="checkbox-input"
        aria-invalid={invalid || undefined}
        {...rest}
      />
      <span className="checkbox-box" aria-hidden="true">
        <Icon name="check" size={12} strokeWidth={3} />
      </span>
      <span className="checkbox-label">{children}</span>
    </label>
  )
}

export default Checkbox
