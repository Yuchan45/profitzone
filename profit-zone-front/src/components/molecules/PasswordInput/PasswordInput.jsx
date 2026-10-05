import { useState } from 'react'
import Input from '../../atoms/Input/Input.jsx'
import Icon from '../../atoms/Icon/Icon.jsx'
import './PasswordInput.css'

// Input de contraseña con botón para mostrarla u ocultarla.
function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input">
      <Input {...props} type={visible ? 'text' : 'password'} className="password-input-field" />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
      </button>
    </div>
  )
}

export default PasswordInput
