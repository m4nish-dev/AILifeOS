import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Calendar, Target, FileText, Sparkles, Flame, Loader2, AlertCircle, Clock, Zap } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import './Dashboard.css'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      const summary = await dashboardService.getDashboardSummary()
      setData(summary)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="dash-loading">
        <Loader2 size={32} className="an-spin" color="var(--green-500)" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="dash-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AlertCircle size={48} color="var(--red-500)" />
        <h2>{error}</h2>
        <button onClick={fetchData} className="an-btn-primary" style={{ marginTop: 16 }}>Retry</button>
      </div>
    )
  }

  const { user, stats, todayFocus, upcomingEvents, activeGoalsList, recentNotes, streakDays, productivityScore, aiInsight } = data

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="dash-page">
      {/* Hero Row */}
      <div className="dash-hero">
        <div>
          <h1 className="dash-hero__title">{user.greeting}, {user.name.split(' ')[0]} 👋</h1>
          <p className="dash-hero__subtitle">Here's what's happening today.</p>
        </div>
        <div className="dash-hero__subtitle" style={{ fontWeight: 500 }}>
          {todayStr}
        </div>
      </div>

      {/* Stats Row */}
      <div className="dash-stats">
        <div className="dash-stat-card">
          <div className="dash-stat__header"><CheckSquare size={16} className="text-green-500" /> Tasks Done</div>
          <div className="dash-stat__value">{stats.tasksDone} / {stats.tasksTotal}</div>
        </div>
        
        <div className="dash-stat-card">
          <div className="dash-stat__header"><Target size={16} className="text-blue-500" /> Active Goals</div>
          <div className="dash-stat__value">{stats.activeGoals}</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat__header"><Flame size={16} className="text-amber-500" /> Study Streak</div>
          <div className="dash-stat__value" style={{ color: streakDays >= 7 ? 'var(--amber-500)' : 'inherit' }}>
            {streakDays} <span style={{fontSize: 14, fontWeight: 'normal', color: 'var(--text-tertiary)'}}>days</span>
          </div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat__header"><Zap size={16} className="text-purple-500" /> Productivity Score</div>
          <div className="dash-stat__value">{productivityScore}<span style={{fontSize: 14, fontWeight: 'normal', color: 'var(--text-tertiary)'}}>/100</span></div>
          <div className="dash-goal-progress"><div className="dash-goal-progress__fill" style={{ width: `${productivityScore}%`, background: 'var(--purple-500)' }}></div></div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="dash-insight">
        <Sparkles size={20} className="text-blue-500" />
        <span>{aiInsight}</span>
      </div>

      {/* Row 1 Grids */}
      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card__header"><CheckSquare size={18} /> Today's Focus</div>
          <div className="dash-list">
            {todayFocus.length > 0 ? todayFocus.map(task => (
              <Link to="/tasks" key={task._id} className="dash-list__item">
                <div className="dash-list__item-icon"><CheckSquare size={14} /></div>
                <div className="dash-list__item-content">
                  <div className="dash-list__item-title">{task.title}</div>
                  <div className="dash-list__item-sub">{task.priority.toUpperCase()} Priority</div>
                </div>
              </Link>
            )) : <div className="dash-empty">No pending tasks for today! 🎉</div>}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header"><Calendar size={18} /> Upcoming Events</div>
          <div className="dash-list">
            {upcomingEvents.length > 0 ? upcomingEvents.map(ev => (
              <Link to="/calendar" key={ev._id} className="dash-list__item">
                <div className="dash-list__item-icon"><Clock size={14} /></div>
                <div className="dash-list__item-content">
                  <div className="dash-list__item-title">{ev.title}</div>
                  <div className="dash-list__item-sub">{new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </Link>
            )) : <div className="dash-empty">No upcoming events.</div>}
          </div>
        </div>
      </div>

      {/* Row 2 Grids */}
      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card__header"><Target size={18} /> Active Goals Progress</div>
          <div className="dash-list">
            {activeGoalsList.length > 0 ? activeGoalsList.map(g => (
              <Link to="/goals" key={g._id} className="dash-list__item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span className="dash-list__item-title">{g.title}</span>
                  <span className="dash-list__item-title">{g.progress}%</span>
                </div>
                <div className="dash-goal-progress">
                  <div className="dash-goal-progress__fill" style={{ width: `${g.progress}%`, background: g.color || 'var(--green-500)' }} />
                </div>
              </Link>
            )) : <div className="dash-empty">No active goals.</div>}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__header"><FileText size={18} /> Recent Notes</div>
          <div className="dash-list">
            {recentNotes.length > 0 ? recentNotes.map(n => (
              <Link to="/notes" key={n._id} className="dash-list__item">
                <div className="dash-list__item-icon"><FileText size={14} /></div>
                <div className="dash-list__item-content">
                  <div className="dash-list__item-title">{n.title}</div>
                  <div className="dash-list__item-sub">Updated {new Date(n.updatedAt).toLocaleDateString()}</div>
                </div>
              </Link>
            )) : <div className="dash-empty">No recent notes.</div>}
          </div>
        </div>
      </div>

    </div>
  )
}
