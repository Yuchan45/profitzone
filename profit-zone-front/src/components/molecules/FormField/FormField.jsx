import './FormField.css'

/**
 * Label + control + mensaje de error.
 * Convención: el control recibe `id={id}` y, si hay error,
 * `aria-describedby={`${id}-error`}` (el id del mensaje que se renderiza acá).
 */
function FormField({ id, label, error, children }) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field-label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="form-field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField
