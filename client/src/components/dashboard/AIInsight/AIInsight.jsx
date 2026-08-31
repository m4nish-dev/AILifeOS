import { Sparkles, Check, MessageCircleQuestion } from 'lucide-react'
import { aiInsight } from '../../../data/mockInsights'
import './AIInsight.css'

export default function AIInsight() {
  return (
    <section className="insight">
      <div className="insight__glow" />

      <div className="insight__bot">
        <div className="insight__bot-inner">
          <Sparkles size={30} strokeWidth={2} />
        </div>
        <span className="insight__spark insight__spark--1">✦</span>
        <span className="insight__spark insight__spark--2">✦</span>
      </div>

      <div className="insight__body">
        <div className="insight__tag">
          <Sparkles size={11} strokeWidth={2.5} />
          AI INSIGHT
        </div>
        <h4 className="insight__title">{aiInsight.title}</h4>
        <p className="insight__text">{aiInsight.body}</p>

        <div className="insight__actions">
          <button className="insight__btn insight__btn--primary">
            <Check size={14} strokeWidth={2.5} />
            Accept suggestion
          </button>
          <button className="insight__btn insight__btn--ghost">
            <MessageCircleQuestion size={14} strokeWidth={2.2} />
            Ask for details
          </button>
        </div>
      </div>

      <div className="insight__why">
        <div className="insight__why-title">Why?</div>
        <ul>
          {aiInsight.reasons.map((r) => (
            <li key={r}>
              <Check size={12} strokeWidth={3} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="insight__badge">Based on your goals &amp; deadlines</div>
    </section>
  )
}
