import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'

/**
 * Rutas que requieren sesión. Mientras se recupera la sesión no muestra nada
 * (evita un salto a /login en cada recarga); sin sesión manda a /login y
 * guarda la ruta para volver después.
 */
function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return null

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}

export default ProtectedRoute
