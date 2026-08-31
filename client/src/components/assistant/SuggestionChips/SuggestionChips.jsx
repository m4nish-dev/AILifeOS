import { Sparkles, Calendar, Target, ListTodo, TrendingUp, Coffee } from 'lucide-react'
import './SuggestionChips.css'

const SUGGESTIONS = [
  { icon: ListTodo, text: 'What should I do today?' },
  { icon: Calendar, text: 'Plan my week' },
  { icon: Target, text: 'Review my goals progress' },
  { icon: TrendingUp, text: 'Summarize my week' },
  { icon: Coffee, text: 'How can I improve my focus?' },
  { icon: Sparkles, text: 'Break down my current project into steps' },
]

export default function SuggestionChips({ onPick }) {
  return (
    <div className="sc">
      <div className="sc__brand">
        <div className="sc__icon"><Sparkles size={28} strokeWidth={2} /></div>
        <h1 className="sc__title">How can I help you today?</h1>
        <p className="sc__sub">I can help plan your day, review goals, analyze your progress, and more.</p>
      </div>
      <div className="sc__grid">
        {SUGGESTIONS.map(({ icon: Icon, text }) => (
          <button key={text} className="sc__chip" onClick={() => onPick(text)}>
            <Icon size={14} strokeWidth={2.2} />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
