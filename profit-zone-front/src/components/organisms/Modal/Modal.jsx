import { useEffect, useId, useRef } from 'react'
import Icon from '../../atoms/Icon/Icon.jsx'
import './Modal.css'

/**
 * Modal con <dialog> nativo: atrapa el foco, cierra con Escape y devuelve el foco
 * al elemento que lo abrió. También cierra con la X o con un click afuera.
 */
function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null)
  // id único: puede haber más de un modal en la misma página
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Escape dispara "cancel": se cierra desde el estado del padre
  const handleCancel = (event) => {
    event.preventDefault()
    onClose()
  }

  // El click en el fondo llega al propio <dialog>; adentro, al contenido
  const handleClick = (event) => {
    if (event.target === dialogRef.current) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      onCancel={handleCancel}
      onClick={handleClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export default Modal
