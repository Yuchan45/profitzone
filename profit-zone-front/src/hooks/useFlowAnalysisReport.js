import { useEffect } from 'react'
import { useAnalysisFlow } from './useAnalysisFlow.js'
import { useAnalysisReport } from './useAnalysisReport.js'

/**
 * Reporte de un análisis para el paso 4 (Análisis) del flujo.
 * - Reusa el reporte ya traído solo si es el análisis en curso y no cambió nada desde
 *   que salió bien (`reportReadyFor`): así no repite la consulta paga a Google Places al
 *   ir y volver entre los pasos, pero nunca muestra uno armado con respuestas viejas.
 * - Con el reporte listo, marca el paso 4 como completo en el Stepper. Un reporte
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
