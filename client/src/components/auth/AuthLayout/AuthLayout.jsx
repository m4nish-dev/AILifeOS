import { Sparkles, Zap, Target, Calendar } from 'lucide-react'
import './AuthLayout.css'

export default function AuthLayout({ children }) {
  return (
    <div className="al">
      <aside className="al__brand">
        <div className="al__brand-top">
          <div className="al__logo">
            <div className="al__logo-icon"><Sparkles size={20} strokeWidth={2.4} /></div>
            <span>AI LifeOS</span>
          </div>
          <span className="al__pro">PRO</span>
        </div>

        <div className="al__hero">
          <h1>The AI-powered life OS built for makers.</h1>
          <p>Plan your day, track your goals, capture your thoughts — and let AI do the heavy lifting.</p>

          <div className="al__features">
            <div className="al__feat"><Target size={14} /> AI-generated goal roadmaps</div>
            <div className="al__feat"><Calendar size={14} /> Smart calendar & scheduling</div>
            <div className="al__feat"><Zap size={14} /> Auto-summarized notes & quizzes</div>
            <div className="al__feat"><Sparkles size={14} /> Personal AI assistant</div>
          </div>
        </div>

        <div className="al__foot">
          "Since switching to AI LifeOS, my productivity is up 40% and I actually feel less busy."
          <span>— Sarah K., Product Designer</span>
        </div>
      </aside>

      <main className="al__main">{children}</main>
    </div>
  )
}
