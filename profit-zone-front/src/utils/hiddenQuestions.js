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
