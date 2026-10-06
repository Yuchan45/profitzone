/**
 * Codes de las preguntas que ocultan las opciones elegidas (`metadata.hideQuestions`
 * del catálogo, ej. "Sin atención al público"). El back aplica la misma regla al guardar.
 */
export function hiddenQuestionCodes(questions, answers) {
  const hidden = new Set()
  for (const question of questions) {
    for (const optionCode of answers[question.code] ?? []) {
      const option = question.options.find((o) => o.code === optionCode)
      for (const code of option?.metadata?.hideQuestions ?? []) hidden.add(code)
    }
  }
  return hidden
}

/** Preguntas de la encuesta (business + details) que siguen aplicando con estas respuestas. */
export function visibleQuestions(survey, answers) {
  const questions = [...survey.business, ...survey.details]
  const hidden = hiddenQuestionCodes(questions, answers)
  return questions.filter((q) => !hidden.has(q.code))
}
