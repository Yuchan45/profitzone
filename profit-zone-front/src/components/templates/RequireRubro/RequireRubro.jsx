import { Navigate, Outlet } from 'react-router-dom'
import { useAnalysis } from '../../../hooks/useAnalysis.js'
import { ANALYSIS_PATHS } from '../../../utils/analysisSteps.js'

// Envuelve los pasos del wizard posteriores al rubro: sin rubro elegido, vuelve al paso 1.
function RequireRubro() {
  const { analysis } = useAnalysis()

  if (!analysis.subcategory) {
    return <Navigate to={ANALYSIS_PATHS.rubro} replace />
  }

  return <Outlet />
}

export default RequireRubro
