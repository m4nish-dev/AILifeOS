import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckSquare, Calendar, Target, FileText, Sparkles, Flame, Loader2, AlertCircle,
  Zap, Plus, Play, ChevronRight, MessageSquare
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { dashboardService } from '../../services/dashboardService'
import { analyticsService } from '../../services/analyticsService'
import { studyService } from '../../services/studyService'
import { taskService } from '../../services/taskService'
import './Dashboard.css'

// Circumference of the focus ring (r=40) — must match stroke-dasharray in CSS.
const RING_CIRCUMFERENCE = 251.2
// The ring shows progress toward a 4-hour daily focus target. The minutes
// displayed are real; only the target is a UI convention.
const DAILY_FOCUS_TARGET_MIN = 240

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const formatMinutes = (mins) => {
  const m = Math.max(0, Math.round(mins || 0))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`
}

const timeAgo = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Delta strings arrive from the API as "+25%" / "-10%" / "0%".
const deltaColor = (delta) =>
  typeof delta === 'string' && delta.trim().startsWith('-')
    ? 'var(--red-500)'
    : 'var(--green-500)'

const scoreLabel = (score) => {
  if (score >= 80) return 'Excellent momentum'
  if (score >= 60) return 'Strong day'
  if (score >= 40) return 'Building up'
  if (score > 0) return 'Getting started'
  return 'No activity yet'
}

const streakLabel = (days) => {
  if (days >= 7) return 'On fire! 🔥'
  if (days > 0) return 'Keep it going'
  return 'Start today'
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [overview, setOverview] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [studyStats, setStudyStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [planTab, setPlanTab] = useState('work')
  const [monthOffset, setMonthOffset] = useState(0)
  const [insightDismissed, setInsightDismissed] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const prefersReducedMotion = useReducedMotion()
  const navigate = useNavigate()

  // Fetch everything in parallel. A failure in a secondary panel must not take
  // down the whole dashboard, so only the summary is treated as fatal.
  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, overviewRes, weeklyRes, studyRes] = await Promise.allSettled([
        dashboardService.getDashboardSummary(),
        analyticsService.getOverviewStats(),
        analyticsService.getWeeklyProductivity(),
        studyService.getStats(),
      ])

      if (summaryRes.status !== 'fulfilled') throw summaryRes.reason
      setData(summaryRes.value)
      setError(null)

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value)
      if (weeklyRes.status === 'fulfilled') {
        setWeekly(Array.isArray(weeklyRes.value) ? weeklyRes.value : [])
      }
      if (studyRes.status === 'fulfilled') setStudyStats(studyRes.value)
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleCompleteTask = async (taskId) => {
    if (!taskId || completingId) return
    try {
      setCompletingId(taskId)
      await taskService.updateTask(taskId, { status: 'done' })
      await fetchData()
    } catch (err) {
      console.error('Failed to complete task', err)
    } finally {
      setCompletingId(null)
    }
  }

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

  // Every field is optional — a partial payload must never crash the page.
  const user = data?.user ?? {}
  const stats = data?.stats ?? {}
  const todayFocus = Array.isArray(data?.todayFocus) ? data.todayFocus : []
  const upcomingEvents = Array.isArray(data?.upcomingEvents) ? data.upcomingEvents : []
  const activeGoalsList = Array.isArray(data?.activeGoalsList) ? data.activeGoalsList : []
  const recentNotes = Array.isArray(data?.recentNotes) ? data.recentNotes : []
  const streakDays = data?.streakDays ?? 0
  const productivityScore = data?.productivityScore ?? 0
  const aiInsight = data?.aiInsight ?? ''

  const firstName = (user.name || '').split(' ')[0] || 'there'
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const filteredFocus = todayFocus.filter(task => {
    if (planTab === 'work') return task.category !== 'personal'
    return task.category === 'personal'
  })

  // ── Real focus time for the ring ────────────────────────
  const focusMins = studyStats?.totalMinutesToday ?? 0
  const focusPct = Math.min(focusMins / DAILY_FOCUS_TARGET_MIN, 1)
  const ringOffset = RING_CIRCUMFERENCE * (1 - focusPct)

  // ── Real calendar month (navigable) ─────────────────────
  const calDate = new Date()
  calDate.setDate(1)
  calDate.setMonth(calDate.getMonth() + monthOffset)
  const calYear = calDate.getFullYear()
  const calMonth = calDate.getMonth()
  const monthLabel = calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const firstWeekday = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth

  // Mark only days that genuinely have a scheduled event.
  const eventDays = new Set(
    upcomingEvents
      .map(e => new Date(e.start))
      .filter(d => !Number.isNaN(d.getTime()) && d.getFullYear() === calYear && d.getMonth() === calMonth)
      .map(d => d.getDate())
  )

  // ── Recent activity built from real records ─────────────
  const activityItems = []
  if ((stats.tasksDone ?? 0) > 0) {
    activityItems.push({
      id: 'tasks-today',
      title: `Completed ${stats.tasksDone} task${stats.tasksDone === 1 ? '' : 's'}`,
      ts: Date.now(),
      time: 'today',
      color: 'var(--green-500)',
    })
  }
  recentNotes.forEach(n => {
    activityItems.push({
      id: `note-${n._id}`,
      title: `Updated "${n.title}"`,
      ts: new Date(n.updatedAt).getTime() || 0,
      time: timeAgo(n.updatedAt),
      color: 'var(--blue-500)',
    })
  })
  activityItems.sort((a, b) => b.ts - a.ts)
  const activity = activityItems.slice(0, 5)

  const hasChartData = weekly.length > 0

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.06 }
    }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div
      className="dash-page"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="dash-layout">

        {/* MAIN COLUMN */}
        <div className="dash-main">

          {/* Hero Row */}
          <motion.div className="dash-hero" variants={itemVariants}>
            <div>
              <h1 className="dash-hero__title">
                {user.greeting || 'Hello'}, <span className="text-gradient">{firstName}</span> 👋
              </h1>
              <p className="dash-hero__subtitle">Here's what's happening today.</p>
            </div>
            <div className="dash-hero__date">
              <Calendar size={14} />
              {todayStr}
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div className="dash-stats" variants={itemVariants}>
            <div className="dash-stat-card" data-accent="green">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><CheckSquare size={18} /></div>
                Tasks Done
              </div>
              <div className="dash-stat__value">{stats.tasksDone ?? 0} / {stats.tasksTotal ?? 0}</div>
              <div className="dash-stat__trend" style={{ color: deltaColor(overview?.tasksCompletedDelta) }}>
                {overview?.tasksCompletedDelta
                  ? `${overview.tasksCompletedDelta} vs last week`
                  : 'This week'}
              </div>
              <div className="dash-stat__glow"></div>
            </div>

            <div className="dash-stat-card" data-accent="blue">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><Target size={18} /></div>
                Active Goals
              </div>
              <div className="dash-stat__value">{stats.activeGoals ?? 0}</div>
              <div className="dash-stat__trend text-blue-500">
                {overview ? `${overview.goalsOnTrack ?? 0} on track` : 'In progress'}
              </div>
              <div className="dash-stat__glow"></div>
            </div>

            <div className="dash-stat-card" data-accent="amber">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><Flame size={18} /></div>
                Study Streak
              </div>
              <div className="dash-stat__value" style={{ color: streakDays >= 7 ? 'var(--amber-500)' : 'inherit' }}>
                {streakDays} <span style={{fontSize: 14, fontWeight: 'normal', color: 'var(--text-tertiary)'}}>days</span>
              </div>
              <div className="dash-stat__trend text-amber-500">{streakLabel(streakDays)}</div>
              <div className="dash-stat__glow"></div>
            </div>

            <div className="dash-stat-card" data-accent="purple">
              <div className="dash-stat__header">
                <div className="dash-stat__icon"><Zap size={18} /></div>
                Productivity Score
              </div>
              <div className="dash-stat__value">{productivityScore}<span style={{fontSize: 14, fontWeight: 'normal', color: 'var(--text-tertiary)'}}>/100</span></div>
              <div className="dash-stat__trend text-purple-500">{scoreLabel(productivityScore)}</div>
              <div className="dash-stat__glow"></div>
            </div>
          </motion.div>

          {/* Today's Plan */}
          <motion.div className="dash-section" variants={itemVariants}>
            <div className="dash-section__header">
              <div className="dash-section__title">
                <div className="dash-section__icon-bg"><CheckSquare size={16} /></div>
                Today's Plan
              </div>
              <div className="dash-section__actions">
                <div className="dash-tabs">
                  <button className={`dash-tab ${planTab === 'work' ? 'dash-tab--active' : ''}`} onClick={() => setPlanTab('work')}>Work</button>
                  <button className={`dash-tab ${planTab === 'personal' ? 'dash-tab--active' : ''}`} onClick={() => setPlanTab('personal')}>Personal</button>
                </div>
                <button className="dash-btn-primary" onClick={() => navigate('/tasks')}>
                  <Plus size={16} /> Add Task
                </button>
              </div>
            </div>
            <div className="dash-task-list">
              {filteredFocus.length > 0 ? filteredFocus.map((task, i) => (
                <div className="dash-task-row" key={task._id || i}>
                  <div className={`dash-task-bar dash-task-bar--${task.priority?.toLowerCase() || 'medium'}`}></div>
                  <button
                    className="dash-task-checkbox"
                    aria-label={`Mark "${task.title}" as done`}
                    disabled={completingId === task._id}
                    onClick={() => handleCompleteTask(task._id)}
                  ></button>
                  <div className="dash-task-content">
                    <div className="dash-task-title">{task.title}</div>
                    <div className="dash-task-meta">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'No due date'}
                      {task.duration ? ` · ${task.duration}m` : ''}
                    </div>
                  </div>
                  <div className="dash-task-right">
                    <span className={`dash-badge dash-badge--${task.priority?.toLowerCase() || 'medium'}`}>{task.priority || 'medium'}</span>
                    <button
                      className="dash-icon-btn"
                      aria-label="Start a focus session"
                      onClick={() => navigate('/study')}
                    >
                      <Play size={14} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="dash-empty">
                  <CheckSquare size={32} color="var(--text-tertiary)" />
                  <p>No {planTab} tasks yet</p>
                  <button className="dash-btn-primary" style={{marginTop: 8}} onClick={() => navigate('/tasks')}>Create one</button>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Insight */}
          {aiInsight && !insightDismissed && (
            <motion.div className="dash-insight-card" variants={itemVariants}>
              <div className="dash-insight__icon"><Sparkles size={18} /></div>
              <div className="dash-insight__content">
                <p>{aiInsight}</p>
                <div className="dash-insight__actions">
                  <button className="dash-btn-ghost" onClick={() => setInsightDismissed(true)}>Dismiss</button>
                  <button
                    className="dash-btn-ghost"
                    style={{color: 'var(--green-500)'}}
                    onClick={() => navigate('/tasks')}
                  >
                    View tasks
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Triple Row */}
          <motion.div className="dash-triple-grid" variants={itemVariants}>

            <div className="dash-card dash-card--chart">
              <div className="dash-card__header">Productivity Overview</div>
              <div className="dash-chart-container">
                {hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekly} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--green-500)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--green-500)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--coffee-500)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--coffee-500)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Area type="monotone" dataKey="focus" name="Focus (h)" stroke="var(--coffee-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorBase)" />
                      <Area type="monotone" dataKey="tasks" name="Tasks done" stroke="var(--green-500)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="dash-empty">
                    <Zap size={28} color="var(--text-tertiary)" />
                    <p>No activity this week yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="dash-card dash-card--actions">
              <div className="dash-card__header">Quick Actions</div>
              <div className="dash-quick-actions">
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--blue-500)', '--qa-bg': 'var(--blue-50)' }} onClick={() => navigate('/notes')}><FileText size={20} /><span>New Note</span></button>
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--green-500)', '--qa-bg': 'var(--green-50)' }} onClick={() => navigate('/tasks')}><CheckSquare size={20} /><span>Add Task</span></button>
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--purple-500)', '--qa-bg': 'var(--purple-50)' }} onClick={() => navigate('/assistant')}><Sparkles size={20} /><span>Ask AI</span></button>
                <button className="dash-qa-btn" style={{ '--qa-color': 'var(--amber-500)', '--qa-bg': 'var(--amber-50)' }} onClick={() => navigate('/goals')}><Target size={20} /><span>Log Goal</span></button>
              </div>
            </div>

            <div className="dash-card dash-card--recent">
              <div className="dash-card__header">Recent Activity</div>
              <div className="dash-timeline">
                {activity.length > 0 ? activity.map(item => (
                  <div className="dash-tl-item" key={item.id}>
                    <div className="dash-tl-dot" style={{ background: item.color }}></div>
                    <div className="dash-tl-content">
                      <div className="dash-tl-title">{item.title}</div>
                      <div className="dash-tl-time">{item.time}</div>
                    </div>
                  </div>
                )) : (
                  <div className="dash-empty">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>

          </motion.div>

        </div>

        {/* RIGHT ASIDE */}
        <div className="dash-aside">

          <motion.div className="dash-card dash-card--cal" variants={itemVariants}>
            <div className="dash-cal-header">
              <span>{monthLabel}</span>
              <div className="dash-cal-nav">
                <button aria-label="Previous month" onClick={() => setMonthOffset(o => o - 1)}>
                  <ChevronRight size={14} style={{transform:'rotate(180deg)'}}/>
                </button>
                <button aria-label="Next month" onClick={() => setMonthOffset(o => o + 1)}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <div className="dash-cal-grid">
              {WEEKDAY_LABELS.map((d, i) => <div key={i} className="dash-cal-day-head">{d}</div>)}
              {/* Leading blanks so the 1st lands on the correct weekday */}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`blank-${i}`} className="dash-cal-day" style={{ visibility: 'hidden' }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const isToday = isCurrentMonth && day === today.getDate()
                const hasEvent = eventDays.has(day)
                return (
                  <div
                    key={day}
                    className={`dash-cal-day ${isToday ? 'dash-cal-day--today' : ''} ${hasEvent ? 'dash-cal-day--has-task' : ''}`}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div className="dash-card dash-card--focus" variants={itemVariants}>
            <div className="dash-card__header" style={{marginBottom: 0}}>Daily Focus</div>
            <div className="dash-focus-ring-container">
              <svg viewBox="0 0 100 100" className="dash-focus-svg">
                <circle cx="50" cy="50" r="40" className="dash-focus-bg" />
                <motion.circle
                  cx="50" cy="50" r="40" className="dash-focus-stroke"
                  initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                />
              </svg>
              <div className="dash-focus-center">
                <span className="dash-focus-val">{formatMinutes(focusMins)}</span>
                <span className="dash-focus-lbl">Focus</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="dash-card dash-card--goals" variants={itemVariants}>
            <div className="dash-card__header">Active Goals</div>
            <div className="dash-aside-goals">
              {activeGoalsList.length > 0 ? activeGoalsList.map(g => (
                <div className="dash-ag-item" key={g._id}>
                  <div className="dash-ag-head">
                    <span className="dash-ag-title">{g.title}</span>
                    <span className="dash-ag-pct">{g.progress ?? 0}%</span>
                  </div>
                  <div className="dash-ag-bar">
                    <motion.div
                      className="dash-ag-fill"
                      style={{ background: g.color || 'var(--green-500)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${g.progress ?? 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )) : (
                <div className="dash-empty">
                  <Target size={28} color="var(--text-tertiary)" />
                  <p>No active goals</p>
                  <button className="dash-btn-primary" style={{marginTop: 8}} onClick={() => navigate('/goals')}>Set a goal</button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="dash-assistant-mini"
            variants={itemVariants}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/assistant')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/assistant') }}
            style={{ cursor: 'pointer' }}
          >
            <div className="dash-am-orb"></div>
            <div className="dash-am-content">
              <span>Ready to assist.</span>
              <MessageSquare size={14} />
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  )
}
