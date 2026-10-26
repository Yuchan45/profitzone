import { useEffect } from 'react'
import Icon from '../../atoms/Icon/Icon.jsx'
import './Toast.css'

const DURATION_MS = 3500

// Aviso breve abajo a la derecha que se cierra solo. Sin `message` no se muestra.
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onClose, DURATION_MS)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="toast" role="status">
      <Icon name="check" size={16} />
      {message}
    </div>
  )
}

export default Toast
