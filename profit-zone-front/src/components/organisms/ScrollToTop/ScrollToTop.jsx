import { useEffect } from 'react'
import { NavigationType, useLocation, useNavigationType } from 'react-router-dom'

/**
 * Lleva la ventana arriba de todo en cada navegación nueva (también si solo cambia la
 * query, como las secciones de Negocio). React Router conserva el scroll de la página
 * anterior: sin esto, el reporte abre al fondo porque se llega desde el botón del final
 * del análisis. Atrás/adelante (POP) y los reemplazos de la URL actual (REPLACE) no se tocan.
 * Es un componente sin UI para que solo él se vuelva a renderizar al navegar.
 */
function ScrollToTop() {
  const { key } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === NavigationType.Push) window.scrollTo({ top: 0 })
  }, [key, navigationType])

  return null
}

export default ScrollToTop
