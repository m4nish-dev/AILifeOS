import { useState } from 'react'
import { X, Sparkles, Check, Loader, Wand2 } from 'lucide-react'
import { aiService } from '../../../services/aiService'
import './AIRoadmapModal.css'

const EXAMPLES = [
  'Become job-ready as a frontend developer in 30 days',
  'Learn Data Structures & Algorithms in 3 months',
  'Build and launch a SaaS product in 60 days',
  'Get fit and run a 10K in 8 weeks',
]

export default function AIRoadmapModal({ open, onClose, onGenerate }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  if (!open) return null

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const data = await aiService.generateGoalRoadmap(prompt)
      setResult(data)
    } catch (err) {
      console.error('AI generation failed', err)
      alert('Failed to generate roadmap. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const accept = () => {
    if (!result) return
    const milestones = result.weeks.flatMap((w, i) =>
      w.milestones.map((title, j) => ({
        id: `m${i}-${j}`, title, done: false, week: w.week,
      }))
    )
    onGenerate({
      id: `g${Date.now()}`,
      title: result.title,
      description: result.description,
      category: 'learning',
      status: 'active',
      progress: 0,
      color: 'coffee',
      icon: 'brain',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + result.weeks.length * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      milestones,
    })
    setPrompt(''); setResult(null)
    onClose()
  }

  const reset = () => { setPrompt(''); setResult(null) }

  return (
    <div className="arm__backdrop" onClick={onClose}>
      <div className="arm" onClick={(e) => e.stopPropagation()}>
        <div className="arm__head">
          <div>
            <div className="arm__badge"><Sparkles size={11} strokeWidth={2.5} /> AI Powered</div>
            <h2 className="arm__title">Generate Goal Roadmap</h2>
            <p className="arm__sub">Describe your goal and AI will create a week-by-week action plan.</p>
          </div>
          <button className="arm__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="arm__body">
          {!result ? (
            <>
              <div className="arm__prompt">
                <label>What do you want to achieve?</label>
                <textarea
                  className="arm__textarea"
                  placeholder="e.g. Become a full-stack developer in 90 days..."
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="arm__examples">
                <label>Or try an example:</label>
                <div className="arm__example-chips">
                  {EXAMPLES.map((ex) => (
                    <button key={ex} className="arm__example" onClick={() => setPrompt(ex)} disabled={loading}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button className="arm__generate" onClick={generate} disabled={!prompt.trim() || loading}>
                {loading ? (
                  <><Loader size={16} className="arm__spin" /> Generating your roadmap...</>
                ) : (
                  <><Wand2 size={16} strokeWidth={2.4} /> Generate Roadmap</>
                )}
              </button>
            </>
          ) : (
            <div className="arm__result">
              <div className="arm__result-head">
                <div>
                  <div className="arm__result-title">{result.title}</div>
                  <div className="arm__result-desc">{result.description}</div>
                </div>
                <div className="arm__result-stats">
                  <span>{result.weeks.length} weeks</span>
                  <span>{result.weeks.reduce((s, w) => s + w.milestones.length, 0)} milestones</span>
                </div>
              </div>

              <div className="arm__weeks">
                {result.weeks.map((w) => (
                  <div key={w.week} className="arm__week">
                    <div className="arm__week-head">
                      <span className="arm__week-num">W{w.week}</span>
                      <span className="arm__week-focus">{w.focus}</span>
                    </div>
                    <ul className="arm__week-list">
                      {w.milestones.map((m, i) => (
                        <li key={i}><Check size={11} strokeWidth={3} /> {m}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="arm__actions">
                <button className="arm__btn arm__btn--ghost" onClick={reset}>Try Again</button>
                <button className="arm__btn arm__btn--primary" onClick={accept}>
                  <Check size={14} strokeWidth={2.5} /> Accept &amp; Create Goal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
