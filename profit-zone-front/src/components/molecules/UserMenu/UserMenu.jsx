import { useEffect, useId, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Icon from '../../atoms/Icon/Icon.jsx'
import './UserMenu.css'

/**
 * Botón del usuario logueado que despliega sus opciones (perfil y cerrar sesión). "Mis reportes" va
 * como link directo en la Navbar, no acá.
 * Cierra con un click afuera, con Escape (devuelve el foco al botón) o al elegir una opción.
 */
function UserMenu({ initials, name, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (!rootRef.current.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)

  const handleLogout = () => {
    close()
    onLogout()
  }

  return (
    <div className={`user-menu${open ? ' user-menu--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        ref={triggerRef}
        aria-label={`Menú de ${name}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="user-menu-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="user-menu-name">{name}</span>
        <Icon name="chevron-down" size={16} className="user-menu-chevron" />
      </button>

      <ul className="user-menu-list" id={menuId} hidden={!open}>
        <li>
          <NavLink to="/perfil" className="user-menu-item" onClick={close}>
            <Icon name="user-round" size={16} />
            Mi perfil
          </NavLink>
        </li>
        <li className="user-menu-list-footer">
          <button type="button" className="user-menu-item user-menu-item--danger" onClick={handleLogout}>
            <Icon name="log-out" size={16} />
            Cerrar sesión
          </button>
        </li>
      </ul>
    </div>
  )
}

export default UserMenu
