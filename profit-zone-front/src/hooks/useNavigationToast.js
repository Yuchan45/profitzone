import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Toast que llega en el state de la navegación: `navigate(to, { state: { toast } })`.
 * Devuelve `{ message, close }` para el componente Toast. El mensaje se toma al montar
 * la página y se saca del historial, para que un refresh no lo repita.
 */
export function useNavigationToast() {
  const location = useLocation()
  const navigate = useNavigate()
  const [message, setMessage] = useState(location.state?.toast ?? null)
  const close = useCallback(() => setMessage(null), [])

  useEffect(() => {
    if (!location.state?.toast) return
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    )
  }, [location, navigate])

  return { message, close }
}
