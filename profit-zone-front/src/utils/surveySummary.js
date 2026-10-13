import { visibleQuestions } from './hiddenQuestions.js'

// Etiquetas cortas del panel "Tu negocio" para las preguntas generales
const SUMMARY_LABELS = {
  service_mode: 'Atención',
  target_age: 'Público',
  schedule: 'Horario',
  arrival_type: 'Cliente',
  budget: 'Presupuesto',
}

export function buildSummaryRows(survey, answers) {
  // Respuestas de preguntas ocultas (ej. con "Sin atención al público") no se muestran
  const visible = visibleQuestions(survey, answers)
  const labelOf = (question) =>
    (answers[question.code] ?? [])
      .map((code) => question.options.find((option) => option.code === code)?.label)
      .filter(Boolean)
      .join(', ')

  const rows = [{ label: 'Rubro', value: `${survey.category.name} · ${survey.subcategory.name}` }]
  for (const question of visible.filter((q) => q.section === 'business')) {
    const value = labelOf(question)
    if (value) rows.push({ label: SUMMARY_LABELS[question.code] ?? question.prompt, value })
  }
  const details = visible.filter((q) => q.section === 'details').map(labelOf).filter(Boolean).join(' · ')
  if (details) rows.push({ label: 'Detalles', value: details })
  return rows
}

/**
 * Criterio de competencia directa para la vista previa: la opción elegida que tiene
 * etiquetas de OSM asociadas (`metadata.osmCuisine`, ej. "Asiática") como "pregunta:opción".
 */
export function directMatch(survey, answers) {
  for (const question of visibleQuestions(survey, answers)) {
    for (const code of answers[question.code] ?? []) {
      const option = question.options.find((o) => o.code === code)
      if (option?.metadata?.osmCuisine?.length) return `${question.code}:${option.code}`
    }
  }
  return null
}
