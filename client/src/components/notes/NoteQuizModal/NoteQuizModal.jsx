import { useState, useEffect } from 'react'
import { X, Loader, Check, BookOpen, FileQuestion, Sparkles } from 'lucide-react'
import { aiService } from '../../../services/aiService'
import './NoteQuizModal.css'

export default function NoteQuizModal({ open, mode, note, onClose }) {
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [showAnswers, setShowAnswers] = useState(false)

  const [summary, setSummary] = useState(null)
  const [quiz, setQuiz] = useState(null)

  useEffect(() => {
    if (!open || !note) return
    setLoading(true); setAnswers({}); setShowAnswers(false); setSummary(null); setQuiz(null)
    
    const fetchAI = async () => {
      try {
        if (mode === 'summary') {
          const data = await aiService.summarizeNote(note.id || note._id)
          setSummary(data)
        } else {
          const data = await aiService.generateQuiz(note.id || note._id)
          setQuiz(data.questions || [])
        }
      } catch (err) {
        console.error('Failed to generate', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAI()
  }, [open, note, mode])

  if (!open || !note) return null

  return (
    <div className="nqm__backdrop" onClick={onClose}>
      <div className="nqm" onClick={(e) => e.stopPropagation()}>
        <div className={`nqm__head nqm__head--${mode === 'summary' ? 'green' : 'coffee'}`}>
          <div>
            <div className="nqm__badge">
              <Sparkles size={11} strokeWidth={2.5} /> AI Generated
            </div>
            <h2 className="nqm__title">
              {mode === 'summary' ? <><BookOpen size={18} /> Summary</> : <><FileQuestion size={18} /> Quiz</>}
            </h2>
            <p className="nqm__sub">Based on: {note.title}</p>
          </div>
          <button className="nqm__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="nqm__body">
          {loading ? (
            <div className="nqm__loading">
              <Loader size={28} className="nqm__spin" />
              <p>{mode === 'summary' ? 'Analyzing your note…' : 'Generating quiz questions…'}</p>
            </div>
          ) : mode === 'summary' ? (
            <div className="nqm__summary">
              {summary && (
                <>
                  <div className="nqm__section">
                    <h3>Key Points</h3>
                    <ul>
                      {(summary.keyPoints || []).map((p, i) => (
                        <li key={i}><Check size={13} strokeWidth={3} /> {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="nqm__section">
                    <h3>TL;DR</h3>
                    <p>{summary.tldr}</p>
                  </div>
                  <div className="nqm__section">
                    <h3>Study Tip</h3>
                    <p className="nqm__tip">💡 {summary.tip}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="nqm__quiz">
              {quiz && quiz.map((q, i) => (
                <div key={i} className="nqm__q">
                  <div className="nqm__q-head">
                    <span className="nqm__q-num">Q{i + 1}</span>
                    <p className="nqm__q-text">{q.question}</p>
                  </div>
                  <div className="nqm__q-options">
                    {(q.options || []).map((opt, j) => {
                      const selected = answers[i] === j
                      const isCorrect = j === q.correct
                      const showResult = showAnswers
                      let cls = 'nqm__opt'
                      if (showResult && isCorrect) cls += ' nqm__opt--correct'
                      else if (showResult && selected && !isCorrect) cls += ' nqm__opt--wrong'
                      else if (selected) cls += ' nqm__opt--selected'
                      return (
                        <button key={j} className={cls}
                          onClick={() => !showResult && setAnswers({ ...answers, [i]: j })}
                          disabled={showResult}>
                          <span className="nqm__opt-letter">{String.fromCharCode(65 + j)}</span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {showAnswers && (
                    <div className="nqm__q-explain">💡 {q.explanation}</div>
                  )}
                </div>
              ))}
              {!showAnswers ? (
                <button className="nqm__submit" onClick={() => setShowAnswers(true)}>
                  <Check size={14} strokeWidth={2.5} /> Check Answers
                </button>
              ) : (
                <div className="nqm__score">
                  You got {quiz ? Object.keys(answers).filter(i => answers[i] === quiz[i].correct).length : 0} / {quiz ? quiz.length : 0} correct!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
