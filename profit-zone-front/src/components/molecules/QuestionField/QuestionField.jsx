import Chip from '../../atoms/Chip/Chip.jsx'
import './QuestionField.css'

// Pregunta de la encuesta con sus opciones como chips.
// inputType: 'single_choice' | 'multi_choice'. `value` es el array de codes elegidos.
function QuestionField({ code, prompt, helpText, inputType, options, value = [], onChange }) {
  const isMulti = inputType === 'multi_choice'
  const titleId = `question-${code}`

  const handleToggle = (optionCode) => {
    if (!isMulti) {
      onChange([optionCode])
      return
    }
    onChange(
      value.includes(optionCode)
        ? value.filter((selected) => selected !== optionCode)
        : [...value, optionCode],
    )
  }

  return (
    <div className="question-field" role="group" aria-labelledby={titleId}>
      <div className="question-field-header">
        <p id={titleId} className="question-field-prompt">
          {prompt}
        </p>
        {helpText && <p className="question-field-help">{helpText}</p>}
      </div>
      <div className="question-field-options">
        {options.map((option) => (
          <Chip
            key={option.code}
            selected={value.includes(option.code)}
            onClick={() => handleToggle(option.code)}
          >
            {option.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export default QuestionField
