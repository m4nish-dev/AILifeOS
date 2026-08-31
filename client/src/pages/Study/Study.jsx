import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, BookOpen, Clock, Flame, Award } from 'lucide-react'
import { studyService } from '../../services/studyService'
import './Study.css'

export default function Study() {
  const [stats, setStats] = useState(null)
  const [history, setHistory] = useState([])
  
  // Timer State (Persisted in localStorage)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [subject, setSubject] = useState('')
  
  const timerRef = useRef(null)

  // Load state on mount
  useEffect(() => {
    loadStats()
    const saved = localStorage.getItem('ailifeos_study_timer')
    if (saved) {
      const parsed = JSON.parse(saved)
      const now = Math.floor(Date.now() / 1000)
      if (parsed.isActive && parsed.sessionId) {
        // Calculate missed time
        const diff = now - parsed.lastTick
        const newTime = Math.max(0, parsed.timeLeft - diff)
        setTimeLeft(newTime)
        setIsActive(true)
        setSessionId(parsed.sessionId)
        setSubject(parsed.subject)
      } else {
        setTimeLeft(parsed.timeLeft)
        setSubject(parsed.subject || '')
        if (parsed.sessionId) setSessionId(parsed.sessionId)
      }
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1
          localStorage.setItem('ailifeos_study_timer', JSON.stringify({
            timeLeft: next,
            isActive: true,
            sessionId,
            subject,
            lastTick: Math.floor(Date.now() / 1000)
          }))
          return next
        })
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      // Auto complete
      endTimer(true)
    }

    return () => clearInterval(timerRef.current)
  }, [isActive, timeLeft])

  const loadStats = async () => {
    try {
      const data = await studyService.getStats()
      setStats(data)
      const sessions = await studyService.getSessions()
      setHistory(sessions.slice(0, 5))
    } catch (err) {
      console.error(err)
    }
  }

  const startTimer = async () => {
    if (timeLeft === 0) setTimeLeft(25 * 60)
    if (!sessionId) {
      // Create new session
      try {
        const sess = await studyService.startSession({
          subject: subject || 'General Focus',
          plannedDuration: timeLeft
        })
        setSessionId(sess._id)
      } catch(err) {
        console.error('Failed to start session', err)
        return
      }
    }
    setIsActive(true)
  }

  const pauseTimer = () => {
    setIsActive(false)
    localStorage.setItem('ailifeos_study_timer', JSON.stringify({
      timeLeft, isActive: false, sessionId, subject
    }))
  }

  const endTimer = async (completed = false) => {
    setIsActive(false)
    clearInterval(timerRef.current)
    
    if (sessionId) {
      try {
        const duration = 25 * 60 - timeLeft
        await studyService.endSession(sessionId, { completed, duration })
        setSessionId(null)
        setTimeLeft(25 * 60)
        setSubject('')
        localStorage.removeItem('ailifeos_study_timer')
        loadStats()
      } catch(err) {
        console.error('Failed to end session', err)
      }
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="study-page">
      <div className="study-timer-section">
        <div className={`study-timer__circle ${isActive ? 'study-timer__circle--active' : ''}`}>
          <div className="study-timer__time">{formatTime(timeLeft)}</div>
          <div className="study-timer__mode">Pomodoro</div>
        </div>

        <div className="study-timer__controls">
          {!isActive ? (
            <button className="study-timer__btn study-timer__btn--start" onClick={startTimer}>
              <Play size={20} fill="currentColor" /> Start Focus
            </button>
          ) : (
            <button className="study-timer__btn study-timer__btn--pause" onClick={pauseTimer}>
              <Pause size={20} fill="currentColor" /> Pause
            </button>
          )}
          
          <button 
            className="study-timer__btn study-timer__btn--stop" 
            onClick={() => endTimer(false)}
            disabled={!sessionId && !isActive}
          >
            <Square size={20} fill="currentColor" /> Stop
          </button>
        </div>

        <div className="study-timer__settings">
          <div className="study-timer__input-group">
            <label>What are you focusing on?</label>
            <input 
              className="study-timer__input" 
              placeholder="e.g. Data Structures, React..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isActive}
            />
          </div>
        </div>
      </div>

      <div className="study-stats-section">
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
            {stats?.currentStreak || 0} <span>days</span>
          </div>
        </div>

        <div className="study-stat-card" style={{ flex: 1 }}>
          <div className="study-stat__header">
            <Award size={16} className="text-green-500" /> Recent Sessions
          </div>
          <div className="study-history__list">
            {history.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No sessions yet.</p>}
            {history.map(s => (
              <div key={s._id} className="study-history__item">
                <div className="study-history__item-info">
                  <span className="study-history__item-title">{s.subject || 'General Focus'}</span>
                  <span className="study-history__item-time">{new Date(s.startedAt).toLocaleDateString()}</span>
                </div>
                <div className="study-history__item-duration">
                  {Math.round(s.duration / 60)} min
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
