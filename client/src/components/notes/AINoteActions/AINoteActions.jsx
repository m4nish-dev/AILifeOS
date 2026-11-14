import { Sparkles, FileQuestion, BookOpen } from 'lucide-react'
import './AINoteActions.css'

export default function AINoteActions({ onSummarize, onQuiz }) {
  return (
    <div className="ana">
      <span className="ana__label"><Sparkles size={12} /> AI</span>
      <button className="ui-btn ui-btn--secondary" onClick={onSummarize}>
        <BookOpen size={13} /> Summarize
      </button>
      <button className="ui-btn ui-btn--secondary" onClick={onQuiz}>
        <FileQuestion size={13} /> Generate quiz
      </button>
    </div>
  )
}
