const READINGS = { strength: 'fortaleza', weakness: 'debilidad', alert: 'a tener en cuenta', neutral: 'neutral', not_evaluated: 'sin evaluar' }

/**
 * Resume un reporte de zona en texto para que Zoni lo use al responder (el back lo recorta a 3000 caracteres).
 * Solo manda lo que el usuario ya está viendo en pantalla.
 */
export function buildReportContext(report) {
  if (!report?.analysis) return ''
  const { analysis, summary, criteria = [], tier } = report
  const lines = [
    `Reporte de zona: ${[analysis.subcategory?.name, analysis.address, analysis.location && `radio ${analysis.location.radius} m`].filter(Boolean).join(', ')}.`,
  ]
  if (tier) lines.push(`Nivel del análisis: ${tier === 'complete' ? 'completo' : 'básico'}.`)
  if (summary) lines.push(`Resumen: ${summary}`)
  for (const criterion of criteria) {
    lines.push(
      `- ${criterion.label}: tu negocio ${criterion.yourBusiness ?? 'sin dato'}; la zona ${criterion.zone ?? 'sin dato'}; lectura: ${READINGS[criterion.reading] ?? criterion.reading}.`,
    )
  }
  return lines.join('\n')
}
