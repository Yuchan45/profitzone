import QuestionField from '../../molecules/QuestionField/QuestionField.jsx'
import './QuestionList.css'

/** Card con una lista de preguntas separadas por divisores. */
function QuestionList({ questions, answers, onAnswer }) {
  return (
    <div className="question-list">
      {questions.map((question) => (
        <div key={question.code} className="question-list-item">
          <QuestionField
            question={question}
            value={answers[question.code]}
            onChange={(optionCodes) => onAnswer(question.code, optionCodes)}
          />
        </div>
      ))}
    </div>
  )
}

export default QuestionList
