import { buildAnalysisReport } from './report.service.js'
import { isReportLocked, loadAnalysis, markReportGenerated, refundAnalysisCharge } from './analyses.service.js'
import { getCredits } from './credits.service.js'
import { httpError } from '../utils/httpErrors.js'

/** El reporte no tiene ningún dato: ni uno de sus indicadores se pudo calcular. */
function allIndicatorsFailed(report) {
  const applicable = Object.values(report.indicators).filter((indicator) => indicator.status !== 'not_applicable')
  return applicable.length > 0 && applicable.every((indicator) => indicator.status === 'error')
}

/**
 * Abre el reporte de un análisis ya cobrado ("Analizar zona" gastó el crédito).
 * - Reabrirlo no cuesta: solo la primera vez que se genera cuenta para el cobro.
 * - Si esa primera generación falla, se devuelve el crédito y el análisis vuelve a borrador.
 * - Un reporte básico que ya no es el último está bloqueado: se desbloquea mejorándolo a completo.
 * - El contenido depende del nivel: el básico no trae ratings de Google ni el listado de alquileres.
 */
export async function openAnalysisReport(id, user) {
  const analysis = await loadAnalysis(id, user.id)

  if (analysis.tier === null) {
    if (analysis.radiusM === null) {
      throw httpError(409, 'Elegí la ubicación en el mapa antes de generar el reporte.')
    }
    throw httpError(409, 'Analizá la zona para generar el reporte.', 'NOT_ANALYZED')
  }

  if (await isReportLocked(analysis, user.role)) {
    throw httpError(
      403,
      'Este reporte básico quedó en tu historial. Mejoralo a completo con un crédito para volver a verlo.',
      'REPORT_LOCKED',
    )
  }

  const firstTime = analysis.reportGeneratedAt === null
  let report
  try {
    report = await buildAnalysisReport(id, user.id, { tier: analysis.tier })
    if (firstTime && allIndicatorsFailed(report)) throw new Error('No se pudo calcular ningún indicador.')
  } catch (error) {
    if (!firstTime) throw error
    console.error(`[ProfitZone] No se pudo generar el reporte ${id}: ${error.message}`)
    const refunded = await refundAnalysisCharge(id, user)
    throw httpError(
      502,
      refunded
        ? 'No pudimos generar el reporte. No se te cobró: te devolvimos el crédito. Probá de nuevo en un rato.'
        : 'No pudimos generar el reporte. Probá de nuevo en un rato.',
      'REPORT_FAILED',
    )
  }

  if (firstTime) await markReportGenerated(id)
  return { ...report, credits: await getCredits(user.id) }
}
