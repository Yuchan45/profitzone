import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Lleva la ventana arriba de todo al cambiar de página. React Router conserva el
 * scroll de la página anterior: sin esto, el reporte abre al fondo porque se llega
 * desde el botón del final del análisis. Atrás/adelante (POP) no se toca.
 */
export function useScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo({ top: 0 })
  }, [pathname, navigationType])
}
