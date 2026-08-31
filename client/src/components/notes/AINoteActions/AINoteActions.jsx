import { Sparkles, FileQuestion, BookOpen } from 'lucide-react'
import './AINoteActions.css'

export default function AINoteActions({ onSummarize, onQuiz }) {
  return (
    <div className="ana">
      <button className="ana__btn ana__btn--summary" onClick={onSummarize}>
        <BookOpen size={13} strokeWidth={2.4} />
        <span>Summarize</span>
        <span className="ana__ai"><Sparkles size={9} /> AI</span>
      </button>
      <button className="ana__btn ana__btn--quiz" onClick={onQuiz}>
        <FileQuestion size={13} strokeWidth={2.4} />
        <span>Generate Quiz</span>
        <span className="ana__ai"><Sparkles size={9} /> AI</span>
      </button>
    </div>
  )
}
