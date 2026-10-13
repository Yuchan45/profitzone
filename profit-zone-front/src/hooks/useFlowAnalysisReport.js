import { useEffect } from 'react'
import { useAnalysisFlow } from './useAnalysisFlow.js'
import { useAnalysisReport } from './useAnalysisReport.js'

/**
 * Reporte de un análisis para los pasos 4 (Análisis) y 5 (Reporte) del flujo.
 * - Reusa el reporte ya traído solo si es el análisis en curso y no cambió nada desde
 *   que salió bien (`reportReadyFor`): así no repite la consulta paga a Google Places al
 *   ir y volver entre los pasos, pero nunca muestra uno armado con respuestas viejas.
 * - Con el reporte listo, marca los pasos 4 y 5 como completos en el Stepper. Un reporte
 *   de otro análisis (ej. abierto por link directo) no toca el flujo.
 * Devuelve lo mismo que `useAnalysisReport` más `isCurrentAnalysis`.
 */
export function useFlowAnalysisReport(id) {
  const { analysisId, reportReadyFor, setReportReady } = useAnalysisFlow()
  // SQL Server devuelve los UUID en mayúsculas: se comparan sin distinguir mayúsculas
  const isCurrentAnalysis = Boolean(analysisId) && analysisId.toLowerCase() === id.toLowerCase()
  const report = useAnalysisReport(id, { reuse: isCurrentAnalysis && reportReadyFor === analysisId })

  useEffect(() => {
    if (report.status === 'ok' && isCurrentAnalysis) setReportReady(analysisId)
  }, [report.status, isCurrentAnalysis, analysisId, setReportReady])

  return { ...report, isCurrentAnalysis }
}
