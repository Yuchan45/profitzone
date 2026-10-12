import Chip from '../../atoms/Chip/Chip.jsx'
import './QuestionField.css'

/**
 * Pregunta con sus opciones como chips.
 * `value` es el array de codes elegidos: single_choice reemplaza la elección,
 * multi_choice agrega o quita la opción tocada.
 */
function QuestionField({ question, value = [], onChange }) {
  const helpId = `question-${question.code}-help`
  const isMulti = question.inputType === 'multi_choice'

  const handleToggle = (optionCode) => {
    if (!isMulti) {
      onChange([optionCode])
      return
    }
    onChange(
      value.includes(optionCode)
        ? value.filter((code) => code !== optionCode)
        : [...value, optionCode],
    )
  }

  return (
    <fieldset
      className="question-field"
      aria-describedby={question.helpText ? helpId : undefined}
    >
      <legend className="question-field-prompt">{question.prompt}</legend>
      {question.helpText && (
        <p id={helpId} className="question-field-help">
          {question.helpText}
        </p>
      )}
      <div className="question-field-options">
        {question.options.map((option) => (
          <Chip
            key={option.code}
            selected={value.includes(option.code)}
            onClick={() => handleToggle(option.code)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}

export default QuestionField
