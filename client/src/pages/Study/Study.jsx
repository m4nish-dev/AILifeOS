import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Clock, Flame, Book, Brain, Target, Sparkles, PieChart, Plus, Loader2 } from 'lucide-react'
import { studyService } from '../../services/studyService'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import FlashcardDeck from '../../components/study/FlashcardDeck/FlashcardDeck'
import FlashcardStudy from '../../components/study/FlashcardStudy/FlashcardStudy'
import MoodPrompt from '../../components/study/MoodPrompt/MoodPrompt'
import StudyGoalCard from '../../components/study/StudyGoalCard/StudyGoalCard'
import FocusPatternHeatmap from '../../components/study/FocusPatternHeatmap/FocusPatternHeatmap'
import Skeleton from '../../components/common/Skeleton/Skeleton'
import EmptyState from '../../components/common/EmptyState/EmptyState'
import './Study.css'

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
  
  // -- INSIGHTS TAB STATE --
  const [goalProgress, setGoalProgress] = useState([])
  const [heatmapData, setHeatmapData] = useState([])

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
    } catch {
      showToast('Failed to save session', 'error')
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

  return (
    <div className="study-os">
      <div className="study-os__header">
        <h1>Study OS</h1>
        <div className="study-os__tabs">
          {TABS.map(t => (
            <button 
              key={t.id} 
              className={`study-os__tab ${activeTab === t.id ? 'study-os__tab--active' : ''}`}
              onClick={() => { setActiveTab(t.id); setActiveDeck(null); }}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="study-os__content">
        {/* === FOCUS TAB === */}
        {activeTab === 'focus' && (
          <div className="study-os__focus">
            
            <div className="study-os__timer-panel">
              <div className={`study-timer__circle ${isActive ? 'study-timer__circle--active' : ''}`}>
                <div className="study-timer__time">{formatTime(timeLeft)}</div>
                <div className="study-timer__mode">Pomodoro</div>
              </div>

              {showMoodPrompt ? (
                <MoodPrompt onSelect={submitMoodAndEnd} />
              ) : (
                <>
                  <div className="study-timer__controls">
                    {!isActive ? (
                      <button className="study-btn study-btn--primary" onClick={startTimer}>
                        <Play size={20} fill="currentColor" /> Start Focus
                      </button>
                    ) : (
                      <button className="study-btn study-btn--secondary" onClick={pauseTimer}>
                        <Pause size={20} fill="currentColor" /> Pause
                      </button>
                    )}
                    <button 
                      className="study-btn study-btn--stop" 
                      onClick={() => endTimer(false)}
                      disabled={!sessionId && !isActive}
                    >
                      <Square size={20} fill="currentColor" /> Stop
                    </button>
                  </div>

                  <div className="study-timer__setup">
                    <div className="study-field">
                      <label>Subject</label>
                      <input 
                        placeholder="e.g. React, Data Structures..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={isActive}
                      />
                    </div>
                    <div className="study-field">
                      <label>Session Goal</label>
                      <input 
                        placeholder="What do you want to accomplish?"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        disabled={isActive}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="study-os__sidebar">
              <div className="study-stat-card">
                <div className="study-stat__header">
                  <Clock size={16} className="text-blue-500" /> Today's Focus
                </div>
                <div className="study-stat__big-num">
                  {stats?.totalMinutesToday || 0} <span>minutes</span>
                </div>
              </div>
              <div className="study-stat-card">
                <div className="study-stat__header">
                  <Flame size={16} className="text-amber-500" /> Current Streak
                </div>
                <div className="study-stat__big-num" style={{ color: 'var(--amber-500)' }}>
                  {stats ? stats.currentStreak : <Skeleton variant="line" height={32} width={40} />} <span>days</span>
                </div>
              </div>
              <div className="study-ai-insight">
                <Brain size={20} className="text-purple-500" />
                {stats ? (
                  <p>AI suggests focusing on <strong>{stats?.bySubject ? Object.keys(stats.bySubject)[0] || 'your core subjects' : 'your core subjects'}</strong> today to maintain your weekly goal velocity.</p>
                ) : (
                  <Skeleton variant="line" height={20} count={2} />
                )}
              </div>
            </div>
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
                  <h2>Your Decks</h2>
                  <button className="study-btn study-btn--secondary">
                    <Sparkles size={16} /> Generate with AI
                  </button>
                </div>
                {decks.length === 0 ? (
                  <EmptyState
                    icon={Book}
                    title="No flashcard decks yet."
                    description="Create your first deck to start remembering."
                    actionLabel="Create Deck"
                    onAction={() => showToast('Feature coming soon', 'info')}
                  />
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
              </>
            )}
          </div>
        )}

        {/* === INSIGHTS TAB === */}
        {activeTab === 'insights' && (
          <div className="study-os__insights">
            <div className="study-insights__section">
              <div className="study-os__toolbar">
                <h2>Weekly Goals</h2>
                <button className="study-btn study-btn--secondary"><Plus size={16} /> Set Goal</button>
              </div>
              <div className="study-goals-grid">
                {!stats ? (
                  <Skeleton variant="card" height={120} count={2} />
                ) : goalProgress.length === 0 ? (
                  <p className="study-empty-text">No weekly goals set. Set one to track your progress!</p>
                ) : (
                  goalProgress.map(gp => (
                    <StudyGoalCard key={gp.id} goal={gp} />
                  ))
                )}
              </div>
            </div>

            <div className="study-insights__section" style={{ marginTop: 32 }}>
              <h2>Focus Pattern Heatmap</h2>
              <p className="study-subtitle">When are you most productive? (Last 30 days)</p>
              <div className="study-heatmap-container">
                {!stats ? (
                  <Skeleton variant="card" height={150} />
                ) : heatmapData.length === 0 ? (
                  <EmptyState 
                    icon={PieChart} 
                    title="No focus data yet" 
                    description="Complete a focus session to see your productivity heatmap." 
                  />
                ) : (
                  <FocusPatternHeatmap data={heatmapData} />
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
