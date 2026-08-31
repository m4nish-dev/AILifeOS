import { Sparkles, Send } from 'lucide-react'
import './AssistantMini.css'

const suggestions = [
  'What should I do today?',
  'Plan my week',
]

export default function AssistantMini() {
  return (
    <div className="asstm">
      <div className="asstm__head">
        <div className="asstm__title">
          <div className="asstm__mark"><Sparkles size={12} strokeWidth={2.5} /></div>
          <span>LifeOS Assistant</span>
        </div>
        <span className="asstm__online">
          <span className="asstm__online-dot" /> Online
        </span>
      </div>

      <div className="asstm__input">
        <input placeholder="Ask me anything…" />
        <button aria-label="Send"><Send size={14} /></button>
      </div>

      <div className="asstm__chips">
        {suggestions.map((s) => (
          <button key={s} className="asstm__chip">{s}</button>
        ))}
      </div>
    </div>
  )
}
