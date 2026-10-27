import { useEffect, useId, useRef, useState } from 'react'
import Icon from '../../atoms/Icon/Icon.jsx'
import './InfoTip.css'

/**
 * Ícono ⓘ con una explicación breve. Se ve al pasar el mouse o con el foco (teclado) y
 * se abre o cierra al tocarlo (en mobile no hay hover). Escape o un toque afuera lo cierran.
 * `label`: nombre accesible del botón (ej. "Qué es la afluencia"). `children`: el texto.
 */
function InfoTip({ label, children }) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutside)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutside)
    }
  }, [open])

  return (
    <span className={`info-tip${open ? ' info-tip--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="info-tip-button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={tipId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="info" size={16} />
      </button>
      <span id={tipId} role="tooltip" className="info-tip-bubble">
        {children}
      </span>
    </span>
  )
}

export default InfoTip
