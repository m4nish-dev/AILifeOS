import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock, Flame, Book, Brain, Sparkles, PieChart, Plus } from 'lucide-react'
import { studyService } from '../../services/studyService'
import { useToast } from '../../context/ToastContext'
import FlashcardDeck from '../../components/study/FlashcardDeck/FlashcardDeck'
import FlashcardStudy from '../../components/study/FlashcardStudy/FlashcardStudy'
import MoodPrompt from '../../components/study/MoodPrompt/MoodPrompt'
import StudyGoalCard from '../../components/study/StudyGoalCard/StudyGoalCard'
import FocusPatternHeatmap from '../../components/study/FocusPatternHeatmap/FocusPatternHeatmap'
import CreateDeckModal from '../../components/study/CreateDeckModal/CreateDeckModal'
import PageHeader from '../../components/common/PageHeader/PageHeader'
import StatGrid from '../../components/common/StatGrid/StatGrid'
import './Study.css'

const SESSION_SECONDS = 25 * 60
const DAILY_TARGET_MIN = 240
const RING_R = 108
const RING_C = 2 * Math.PI * RING_R

const TABS = [
  { id: 'focus', label: 'Focus', icon: Clock },
  { id: 'flashcards', label: 'Flashcards', icon: Book },
  { id: 'insights', label: 'Insights', icon: PieChart }
]

export default function Study() {
  const [activeTab, setActiveTab] = useState('focus')
  const { showToast } = useToast()
  
  // -- FOCUS TAB STATE --
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [subject, setSubject] = useState('')
  const [goal, setGoal] = useState('')
  const [showMoodPrompt, setShowMoodPrompt] = useState(false)
  const [stats, setStats] = useState(null)
  const timerRef = useRef(null)

  // -- FLASHCARDS TAB STATE --
  const [decks, setDecks] = useState([])
  const [activeDeck, setActiveDeck] = useState(null)
  const [studyCards, setStudyCards] = useState([])
  const [deckModalOpen, setDeckModalOpen] = useState(false)
  
  // -- INSIGHTS TAB STATE --
  const [goalProgress, setGoalProgress] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState({ subject: '', hoursPerWeek: 5 })
  const [savingGoal, setSavingGoal] = useState(false)

  const handleCreateStudyGoal = async (e) => {
    e.preventDefault()
    if (!goalForm.subject.trim() || savingGoal) return

    const hours = Number(goalForm.hoursPerWeek)
    if (!Number.isFinite(hours) || hours <= 0) {
      return showToast('Enter a weekly target greater than 0 hours', 'error')
    }

    try {
      setSavingGoal(true)
      await studyService.createGoal({
        subject: goalForm.subject.trim(),
        targetMinutesPerWeek: Math.round(hours * 60)
      })
      setGoalModalOpen(false)
      setGoalForm({ subject: '', hoursPerWeek: 5 })
      showToast('Weekly goal created', 'success')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create goal', 'error')
    } finally {
      setSavingGoal(false)
    }
  }

  useEffect(() => {
    loadData()
    // Restore timer if exists
    const saved = localStorage.getItem('ailifeos_study_timer')
    if (saved) {
      const parsed = JSON.parse(saved)
      const now = Math.floor(Date.now() / 1000)
      if (parsed.isActive && parsed.sessionId) {
        const diff = now - parsed.lastTick
        setTimeLeft(Math.max(0, parsed.timeLeft - diff))
        setIsActive(true)
        setSessionId(parsed.sessionId)
        setSubject(parsed.subject)
        setGoal(parsed.goal || '')
      } else {
        setTimeLeft(parsed.timeLeft)
        setSubject(parsed.subject || '')
        setGoal(parsed.goal || '')
        if (parsed.sessionId) setSessionId(parsed.sessionId)
      }
    }
  }, [])

  const loadData = async () => {
    try {
      const [st, d, gp, hm] = await Promise.all([
        studyService.getStats(),
        studyService.getDecks(),
        studyService.getGoalProgress(),
        studyService.getFocusPattern()
      ])
      setStats(st)
      setDecks(d)
      setGoalProgress(gp)
      setHeatmapData(hm)
    } catch (err) {
      console.error(err)
    }
  }

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1
          localStorage.setItem('ailifeos_study_timer', JSON.stringify({
            timeLeft: next, isActive: true, sessionId, subject, goal, lastTick: Math.floor(Date.now() / 1000)
          }))
          return next
        })
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      endTimer(true)
    }
    return () => clearInterval(timerRef.current)
  }, [isActive, timeLeft])

  const startTimer = async () => {
    if (timeLeft === 0) setTimeLeft(25 * 60)
    if (!sessionId) {
      if (!subject.trim()) return showToast('Please enter a subject', 'error')
      try {
        const sess = await studyService.startSession({
          subject, notes: goal, plannedDuration: timeLeft
        })
        setSessionId(sess._id)
      } catch {
        return showToast('Failed to start session', 'error')
      }
    }
    setIsActive(true)
  }

  const pauseTimer = () => {
    setIsActive(false)
    localStorage.setItem('ailifeos_study_timer', JSON.stringify({
      timeLeft, isActive: false, sessionId, subject, goal
    }))
  }

  const endTimer = async (completed = false) => {
    setIsActive(false)
    clearInterval(timerRef.current)
    if (sessionId) {
      setShowMoodPrompt(true) // Show mood prompt before fully ending
    }
  }

  const submitMoodAndEnd = async (mood) => {
    setShowMoodPrompt(false)
    try {
      const duration = 25 * 60 - timeLeft
      await studyService.endSession(sessionId, { completed: true, duration, mood })
      setSessionId(null)
      setTimeLeft(25 * 60)
      setSubject('')
      setGoal('')
      localStorage.removeItem('ailifeos_study_timer')
      loadData()
      showToast('Session saved!', 'success')
    } catch (err) {
      console.error('End session error:', err)
      showToast(err.response?.data?.message || err.message || 'Failed to save session', 'error')
    }
  }

  // --- FLASHCARD LOGIC ---
  const handleDeckClick = async (deckName) => {
    try {
      const cards = await studyService.getFlashcardsByDeck(deckName)
      // Only study due cards
      const now = new Date()
      const due = cards.filter(c => new Date(c.nextReview) <= now)
      setStudyCards(due.length > 0 ? due : cards) // fallback to all if none due just for demo
      setActiveDeck(deckName)
    } catch {
      showToast('Failed to load deck', 'error')
    }
  }

  const handleReview = async (cardId, correct) => {
    try {
      await studyService.reviewFlashcard(cardId, correct)
    } catch {
      showToast('Failed to save review', 'error')
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const todayMin = stats?.totalMinutesToday || 0
  const streak = stats?.currentStreak || 0
  const topSubject = stats?.bySubject ? Object.keys(stats.bySubject)[0] : null
  const ringProgress = Math.min(1, Math.max(0, (SESSION_SECONDS - timeLeft) / SESSION_SECONDS))

  return (
    <div className="study-os">
      <PageHeader
        title="Study OS"
        subtitle={`${todayMin} minute${todayMin !== 1 ? 's' : ''} of focus today.`}
      />

      <div className="study-os__bar">
        <div className="ui-tabs" role="tablist" aria-label="Study sections">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`ui-tab${activeTab === t.id ? ' ui-tab--active' : ''}`}
              onClick={() => { setActiveTab(t.id); setActiveDeck(null); }}
            >
              <t.icon /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="study-os__content">
        {/* === FOCUS TAB === */}
        {activeTab === 'focus' && (
          <div className="study-os__focus">

            <section className="ui-panel study-timer">
              <div className="ui-panel__head">
                <h2 className="ui-panel__title">Focus session</h2>
                <span className="study-timer__status">
                  <span className={`ui-mark${isActive ? ' ui-mark--orange' : ''}`} />
                  {isActive ? 'In progress' : sessionId ? 'Paused' : 'Ready'}
                </span>
              </div>

              <div className="study-timer__body">
                <div className="study-timer__ring">
                  <svg viewBox="0 0 240 240" aria-hidden="true">
                    <circle cx="120" cy="120" r={RING_R} className="study-timer__track" />
                    <circle
                      cx="120" cy="120" r={RING_R}
                      className="study-timer__progress"
                      strokeDasharray={RING_C}
                      strokeDashoffset={RING_C * (1 - ringProgress)}
                    />
                  </svg>
                  <div className="study-timer__readout">
                    <div className="study-timer__time">{formatTime(timeLeft)}</div>
                    <div className="study-timer__mode">Pomodoro · 25 min</div>
                  </div>
                </div>

                {showMoodPrompt ? (
                  <MoodPrompt onSelect={submitMoodAndEnd} />
                ) : (
                  <>
                    <div className="study-timer__controls">
                      {!isActive ? (
                        <button className="ui-btn ui-btn--primary ui-btn--lg" onClick={startTimer}>
                          <Play size={14} fill="currentColor" /> {sessionId ? 'Resume' : 'Start focus'}
                        </button>
                      ) : (
                        <button className="ui-btn ui-btn--secondary ui-btn--lg" onClick={pauseTimer}>
                          <Pause size={14} fill="currentColor" /> Pause
                        </button>
                      )}
                      <button
                        className="ui-btn ui-btn--secondary ui-btn--lg"
                        onClick={() => endTimer(false)}
                        disabled={!sessionId && !isActive}
                      >
                        <Square size={12} fill="currentColor" /> Stop
                      </button>
                    </div>

                    <div className="study-timer__setup">
                      <label className="ui-field">
                        <span className="ui-label">Subject</span>
                        <input
                          className="ui-input"
                          placeholder="e.g. React, Data Structures"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          disabled={isActive}
                        />
                      </label>
                      <label className="ui-field">
                        <span className="ui-label">Session goal</span>
                        <input
                          className="ui-input"
                          placeholder="What do you want to accomplish?"
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                          disabled={isActive}
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
            </section>

            <aside className="study-os__sidebar">
              <StatGrid columns={1} items={[
                { key: 'today', label: "Today's focus", value: todayMin, unit: 'min', icon: Clock,
                  progress: Math.round((todayMin / DAILY_TARGET_MIN) * 100), sub: `of ${DAILY_TARGET_MIN / 60}h daily target` },
                { key: 'streak', label: 'Current streak', value: streak, unit: streak === 1 ? 'day' : 'days', icon: Flame,
                  sub: streak ? 'Keep it going' : 'Start one today' },
              ]} />
              <div className="study-note">
                <Brain size={16} />
                <p>Suggested focus today: <strong>{topSubject || 'your core subjects'}</strong>, to keep your weekly goals on pace.</p>
              </div>
            </aside>
          </div>
        )}

        {/* === FLASHCARDS TAB === */}
        {activeTab === 'flashcards' && (
          <div className="study-os__flashcards">
            {activeDeck ? (
              <FlashcardStudy 
                cards={studyCards} 
                onReview={handleReview} 
                onExit={() => { setActiveDeck(null); loadData(); }} 
              />
            ) : (
              <>
                <div className="study-os__toolbar">
                  <h2 className="ui-panel__title">Your decks</h2>
                  <button className="ui-btn ui-btn--dark" onClick={() => setDeckModalOpen(true)}>
                    <Sparkles size={14} /> Generate with AI
                  </button>
                </div>
                {decks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon-wrapper"><Book className="empty-state__icon" strokeWidth={1.6} /></div>
                    <h3 className="empty-state__title">No flashcard decks yet</h3>
                    <p className="empty-state__desc">Generate a deck from any topic with AI, then review the cards that are due each day.</p>
                    <button className="empty-state__btn" onClick={() => setDeckModalOpen(true)}><Plus size={14} /> Create deck</button>
                  </div>
                ) : (
                  <div className="study-decks-grid">
                    {decks.map(d => (
                      <FlashcardDeck 
                        key={d.deckName} 
                        deckName={d.deckName} 
                        total={d.total} 
                        due={d.due} 
                        onClick={() => handleDeckClick(d.deckName)}
                      />
                    ))}
                  </div>
                )}
                
                <CreateDeckModal 
                  open={deckModalOpen} 
                  onClose={() => setDeckModalOpen(false)} 
                  onSuccess={loadData}
                />
              </>
            )}
          </div>
        )}

        {/* === INSIGHTS TAB === */}
        {activeTab === 'insights' && (
          <div className="study-os__insights">
            <div className="study-insights__section">
              <div className="study-os__toolbar">
                <h2 className="ui-panel__title">Weekly goals</h2>
                <button className="ui-btn ui-btn--primary" onClick={() => setGoalModalOpen(true)}>
                  <Plus size={14} /> Set goal
                </button>
              </div>
              <div className="study-goals-grid">
                {goalProgress.length === 0 ? (
                  <p className="study-empty-text">No weekly goals set. Set one to track your progress!</p>
                ) : (
                  goalProgress.map(gp => (
                    <StudyGoalCard key={gp.id} goal={gp} />
                  ))
                )}
              </div>
            </div>

            <div className="study-insights__section ui-panel study-heatmap-panel">
              <div className="ui-panel__head">
                <h2 className="ui-panel__title">Focus pattern</h2>
                <span className="study-subtitle">When you focus best · last 30 days</span>
              </div>
              <div className="study-heatmap-container">
                <FocusPatternHeatmap data={heatmapData} />
              </div>
            </div>

            {goalModalOpen && (
              <div className="sb-modal-overlay" onClick={() => setGoalModalOpen(false)}>
                <form className="sb-modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleCreateStudyGoal}>
                  <h3 className="sb-modal-title">Set a Weekly Goal</h3>
                  <div className="sb-modal-body study-goal-form">
                    <label className="ui-field">
                      <span className="ui-label">Subject</span>
                      <input
                        className="ui-input"
                        autoFocus
                        placeholder="e.g. DSA, React, Physics"
                        value={goalForm.subject}
                        onChange={(e) => setGoalForm({ ...goalForm, subject: e.target.value })}
                      />
                    </label>
                    <label className="ui-field">
                      <span className="ui-label">Target hours per week</span>
                      <input
                        className="ui-input"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={goalForm.hoursPerWeek}
                        onChange={(e) => setGoalForm({ ...goalForm, hoursPerWeek: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="sb-modal-actions">
                    <button type="button" className="sb-btn sb-btn-ghost" onClick={() => setGoalModalOpen(false)}>Cancel</button>
                    <button type="submit" className="sb-btn sb-btn-primary" disabled={savingGoal || !goalForm.subject.trim()}>
                      {savingGoal ? 'Saving…' : 'Create Goal'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
