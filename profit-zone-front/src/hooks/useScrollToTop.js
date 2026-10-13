import { useEffect } from 'react'
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom'

/**
 * Lleva la ventana arriba de todo en cada navegación (también si solo cambia la query,
 * como las secciones de Negocio). React Router conserva el scroll de la página anterior:
 * sin esto, el reporte abre al fondo porque se llega desde el botón del final del
 * análisis. Atrás/adelante (POP) no se toca.
 */
export function useScrollToTop() {
  const { key } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== NavigationType.Pop) window.scrollTo({ top: 0 })
  }, [key, navigationType])
}
