import { Navigate, useParams } from 'react-router-dom'

/** Redirige al paso 4 (Análisis), que unifica todo el análisis y reporte de la zona. */
function Reporte() {
  const { id } = useParams()
  return <Navigate to={`/analizar/analisis/${id}`} replace />
}

export default Reporte
