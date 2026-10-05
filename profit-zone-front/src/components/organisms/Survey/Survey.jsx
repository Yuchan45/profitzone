import QuestionField from '../../molecules/QuestionField/QuestionField.jsx'
import './Survey.css'

// Card con una lista de preguntas separadas por divisores.
// answers: { [questionCode]: optionCode[] }
function Survey({ questions, answers, onAnswer }) {
  return (
    <div className="survey">
      {questions.map((question) => (
        <QuestionField
          key={question.code}
          code={question.code}
          prompt={question.prompt}
          helpText={question.helpText}
          inputType={question.inputType}
          options={question.options}
          value={answers[question.code]}
          onChange={(optionCodes) => onAnswer(question.code, optionCodes)}
        />
      ))}
    </div>
  )
}

export default Survey
