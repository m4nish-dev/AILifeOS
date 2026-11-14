import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  CheckSquare, Calendar, Target, FileText, Sparkles, Flame, Loader2, AlertCircle,
  Zap, Plus, Play, ChevronRight, ChevronLeft, MessageSquare, Clock, ArrowRight, Check,
  CalendarCheck, TrendingUp
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
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

// Modifier label for the app's existing Alt/Option navigation shortcuts
// (useKeyboardShortcuts): ⌥ on Apple platforms, "Alt+" elsewhere.
const MOD_KEY = typeof navigator !== 'undefined'
  && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '') ? '⌥' : 'Alt+'

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

// "Today · 10:00 AM", "Tomorrow · All day", "Wed, Nov 25 · 3:30 PM".
const formatEventWhen = (ev) => {
  const d = new Date(ev?.start)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayDiff = Math.round((startOfDay - startOfToday) / 86400000)
  const dayLabel = dayDiff === 0
    ? 'Today'
    : dayDiff === 1
      ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = ev.allDay ? 'All day' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dayLabel} · ${time}`
}

// Delta strings arrive from the API as "+25%" / "-10%" / "0%".
// Only direction is encoded in colour — everything else stays as ink.
const trendClass = (delta) => {
  if (typeof delta !== 'string') return ''
  const t = delta.trim()
  if (t.startsWith('-')) return 'dash-stat__trend--down'
  if (t.startsWith('+') && !/^\+0+%?$/.test(t)) return 'dash-stat__trend--up'
  return ''
}

const scoreLabel = (score) => {
  if (score >= 80) return 'Excellent momentum'
  if (score >= 60) return 'Strong day'
  if (score >= 40) return 'Building up'
  if (score > 0) return 'Getting started'
  return 'No activity yet'
}

const streakLabel = (days) => {
  if (days >= 7) return 'On fire'
  if (days > 0) return 'Keep it going'
  return 'Start today'
}

const sumBy = (rows, key) =>
  rows.reduce((acc, r) => acc + (Number(r?.[key]) || 0), 0)

const TOOLTIP_PROPS = {
  cursor: { stroke: 'var(--border-strong)', strokeWidth: 1 },
  contentStyle: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 12,
    boxShadow: 'var(--shadow-md)',
  },
  labelStyle: {
    color: 'var(--text-tertiary)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 2,
  },
  itemStyle: { color: 'var(--text-primary)' },
}

/**
 * One panel of the productivity small-multiple. Each series gets its own
 * y-scale, because tasks (a count) and focus (hours) are different units and
 * sharing an axis flattens whichever series is smaller.
 *
 * - variant "bar": whole-number counts per day, with a faint full-height track
 *   behind each day so an empty week still reads as intentional.
 * - variant "area": continuous hours, glowing line, pulsing dot on today.
 * Today is always the last entry (the API returns a rolling 7 days, oldest
 * first), and is lit while the other days are dimmed.
 */
// The y-range never collapses to 0-0: with an all-zero week Recharts would
// otherwise centre the flat line mid-chart, which reads as real activity.
const Y_DOMAIN = [0, (max) => Math.max(max, 1)]

// With scale="band" Recharts centres the data points in each day's column but
// places tick labels at the column's left edge; shift by half a column so each
// label sits under its own bar / point.
const renderDayTick = (lastIndex) => function DayTick({ x, y, payload, index, width, visibleTicksCount }) {
  const halfBand = width && visibleTicksCount ? width / visibleTicksCount / 2 : 0
  return (
    <text
      x={x + halfBand}
      y={y}
      dy={12}
      textAnchor="middle"
      className={index === lastIndex ? 'dash-chart-tick dash-chart-tick--today' : 'dash-chart-tick'}
    >
      {payload.value}
    </text>
  )
}

function ChartPanel({ data, dataKey, name, label, swatch, color, total, showAxis, variant = 'area', isEmpty, emptyText }) {
  const lastIndex = data.length - 1

  const xAxis = (
    <XAxis
      dataKey="day"
      hide={!showAxis}
      axisLine={false}
      tickLine={false}
      interval={0}
      scale="band"
      tick={renderDayTick(lastIndex)}
    />
  )

  const todayDot = (props) => {
    const { cx, cy, index } = props
    if (index !== lastIndex || cx == null || cy == null) return <g key={`d-${index}`} />
    return (
      <g key={`d-${index}`}>
        <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="var(--bg-surface)" strokeWidth={2} />
      </g>
    )
  }

  return (
    <div className="dash-chart-panel">
      <div className="dash-chart-panel__head">
        <span className="dash-chart-panel__label">
          <span className={`dash-chart-swatch dash-chart-swatch--${swatch}`} />
          {label}
        </span>
        <span className="dash-chart-panel__total">{total}</span>
      </div>
      <div className={`dash-chart-plot dash-chart-plot--${swatch} ${showAxis ? 'dash-chart-plot--last' : ''}`}>
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'bar' ? (
            <BarChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
              <YAxis hide domain={Y_DOMAIN} allowDecimals={false} />
              {xAxis}
              <Tooltip {...TOOLTIP_PROPS} cursor={{ fill: 'var(--row-bg-hover)' }} />
              <Bar isAnimationActive={false}
                dataKey={dataKey}
                name={name}
                radius={[6, 6, 6, 6]}
                background={{ fill: 'var(--row-bg-hover)', radius: 6 }}
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === lastIndex ? color : 'var(--accent-border)'}
                    fillOpacity={1}
                    className={i === lastIndex ? 'dash-chart-bar--today' : undefined}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
              <YAxis hide domain={Y_DOMAIN} />
              {xAxis}
              <Tooltip {...TOOLTIP_PROPS} />
              <Area isAnimationActive={false}
                type="monotone"
                dataKey={dataKey}
                name={name}
                stroke={color}
                strokeWidth={2.25}
                fill={color}
                fillOpacity={0.12}
                dot={todayDot}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bg-surface)' }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
        {isEmpty && <div className="dash-chart-empty">{emptyText}</div>}
      </div>
    </div>
  )
}

/**
 * Renders a KPI figure. Static: the UI has no motion.
 */
function CountUp({ value }) {
  return <>{Number(value) || 0}</>
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
        <Loader2 size={28} className="dash-spin" color="var(--text-tertiary)" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="dash-page dash-error">
        <AlertCircle size={32} color="var(--red-500)" />
        <h2>{error}</h2>
        <button onClick={fetchData} className="dash-btn-primary">Retry</button>
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
  const monthName = calDate.toLocaleDateString('en-US', { month: 'long' })
  const firstWeekday = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth
  const monthIsPast = calYear * 12 + calMonth < today.getFullYear() * 12 + today.getMonth()

  // Neighbouring months' days fill the grid out to whole weeks (dimmed,
  // display only) instead of leaving blank holes.
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate()
  const leadingDays = Array.from({ length: firstWeekday }, (_, i) => prevMonthDays - firstWeekday + 1 + i)
  const trailingCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7 - firstWeekday - daysInMonth

  // The current week is drawn as one continuous band.
  const weekStart = today.getDate() - today.getDay()
  const bandStart = Math.max(weekStart, 1)
  const bandEnd = Math.min(weekStart + 6, daysInMonth)

  // How many events land on each day of this month (drives 1-3 dots).
  const eventCounts = new Map()
  upcomingEvents.forEach(e => {
    const d = new Date(e.start)
    if (!Number.isNaN(d.getTime()) && d.getFullYear() === calYear && d.getMonth() === calMonth) {
      eventCounts.set(d.getDate(), (eventCounts.get(d.getDate()) || 0) + 1)
    }
  })
  const upNext = upcomingEvents.slice(0, 3)

  // ── Recent activity built from real records ─────────────
  const activityItems = []
  if ((stats.tasksDone ?? 0) > 0) {
    activityItems.push({
      id: 'tasks-today',
      title: `Completed ${stats.tasksDone} task${stats.tasksDone === 1 ? '' : 's'}`,
      ts: Date.now(),
      time: 'today',
      color: 'var(--accent)',
      kind: 'task',
    })
  }
  recentNotes.forEach(n => {
    activityItems.push({
      id: `note-${n._id}`,
      title: `Updated "${n.title}"`,
      ts: new Date(n.updatedAt).getTime() || 0,
      time: timeAgo(n.updatedAt),
      color: 'var(--blue-500)',
      kind: 'note',
    })
  })
  activityItems.sort((a, b) => b.ts - a.ts)
  const activity = activityItems.slice(0, 5)

  const hasChartData = weekly.length > 0
  const weekTasks = sumBy(weekly, 'tasks')
  const weekFocus = sumBy(weekly, 'focus')
  const weekFocusLabel = `${Number.isInteger(weekFocus) ? weekFocus : weekFocus.toFixed(1)}h`

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.05 }
    }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } }
  }
  // KPI cards cascade in one after another.
  const statsVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: prefersReducedMotion ? 0 : 0.08, delayChildren: 0.05 } }
  }
  const statCardVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 14, scale: prefersReducedMotion ? 1 : 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 24 } }
  }

  // ── KPI micro-visuals, all derived from figures already on the page ──
  const tasksDone = stats.tasksDone ?? 0
  const tasksTotal = stats.tasksTotal ?? 0
  const tasksPct = tasksTotal > 0 ? Math.min(tasksDone / tasksTotal, 1) : 0
  const activeGoals = stats.activeGoals ?? 0
  const goalsOnTrack = overview?.goalsOnTrack ?? 0
  const goalSegments = Math.min(Math.max(activeGoals, 1), 8)
  const goalSegmentsLit = activeGoals > 0 ? Math.round((Math.min(goalsOnTrack, activeGoals) / activeGoals) * goalSegments) : 0
  const streakLit = Math.min(Math.max(streakDays, 0), 7)
  const scorePct = Math.min(Math.max(Number(productivityScore) || 0, 0), 100)

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

          <div className="dash-hero-panel">
            {/* Hero Row */}
            <motion.div className="dash-hero" variants={itemVariants}>
              <div>
                <div className="dash-hero__eyebrow">{todayStr}</div>
                <h1 className="dash-hero__title">
                  {user.greeting || 'Hello'}, <span className="dash-hero__name">{firstName}</span>
                </h1>
                <p className="dash-hero__subtitle">Here's what's happening today.</p>
              </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div className="dash-stats" variants={statsVariants}>
              <motion.div className="dash-stat-card dash-stat-card--tasks" variants={statCardVariants}>
                <div className="dash-stat__header">
                  <span className="dash-stat__icon"><CalendarCheck size={20} strokeWidth={1.8} /></span>
                  <span className="dash-stat__label">Tasks Done</span>
                </div>
                <div className="dash-stat__value">
                  <CountUp value={tasksDone} />
                  <span className="dash-stat__value-unit">/ {tasksTotal}</span>
                </div>
                <div className="dash-stat__viz dash-stat__bar" aria-hidden="true">
                  <span style={{ '--p': tasksPct }} />
                </div>
                <div className={`dash-stat__trend ${trendClass(overview?.tasksCompletedDelta)}`}>
                  {overview?.tasksCompletedDelta
                    ? `${overview.tasksCompletedDelta} vs last week`
                    : 'This week'}
                </div>
              </motion.div>

              <motion.div className="dash-stat-card dash-stat-card--goals" variants={statCardVariants}>
                <div className="dash-stat__header">
                  <span className="dash-stat__icon"><Target size={20} strokeWidth={1.8} /></span>
                  <span className="dash-stat__label">Active Goals</span>
                </div>
                <div className="dash-stat__value"><CountUp value={activeGoals} /></div>
                <div className="dash-stat__viz dash-stat__segments" aria-hidden="true">
                  {Array.from({ length: goalSegments }).map((_, i) => (
                    <span key={i} className={i < goalSegmentsLit ? 'is-lit' : ''} style={{ '--i': i }} />
                  ))}
                </div>
                <div className="dash-stat__trend">
                  {overview ? `${overview.goalsOnTrack ?? 0} on track` : 'In progress'}
                </div>
              </motion.div>

              <motion.div className="dash-stat-card dash-stat-card--streak" variants={statCardVariants}>
                <div className="dash-stat__header">
                  <span className="dash-stat__icon"><Flame size={20} strokeWidth={1.8} /></span>
                  <span className="dash-stat__label">Study Streak</span>
                </div>
                <div className="dash-stat__value">
                  <CountUp value={streakDays} />
                  <span className="dash-stat__value-unit">{streakDays === 1 ? 'day' : 'days'}</span>
                </div>
                {/* Last 7 days, today on the right; a streak is consecutive
                    days ending today, so the lit days are exactly the last N. */}
                <div className="dash-stat__viz dash-stat__week" aria-hidden="true">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className={i >= 7 - streakLit ? 'is-lit' : ''} style={{ '--i': i }} />
                  ))}
                </div>
                <div className="dash-stat__trend">{streakLabel(streakDays)}</div>
              </motion.div>

              <motion.div className="dash-stat-card dash-stat-card--score" variants={statCardVariants}>
                <div className="dash-stat__header">
                  <span className="dash-stat__icon"><TrendingUp size={20} strokeWidth={1.8} /></span>
                  <span className="dash-stat__label">Productivity</span>
                </div>
                <div className="dash-stat__value">
                  <CountUp value={productivityScore} />
                  <span className="dash-stat__value-unit">/ 100</span>
                </div>
                <div className="dash-stat__viz dash-stat__bar dash-stat__bar--light" aria-hidden="true">
                  <span style={{ '--p': scorePct / 100 }} />
                </div>
                <div className="dash-stat__trend">{scoreLabel(productivityScore)}</div>
              </motion.div>
            </motion.div>
          </div>

          {/* Today's Plan */}
          <motion.div className="dash-section" variants={itemVariants}>
            <div className="dash-section__header">
              <div className="dash-section__title">
                Today's Plan
                <span className="dash-section__count">{filteredFocus.length}</span>
              </div>
              <div className="dash-section__actions">
                <div className="dash-tabs">
                  <button className={`dash-tab ${planTab === 'work' ? 'dash-tab--active' : ''}`} onClick={() => setPlanTab('work')}>Work</button>
                  <button className={`dash-tab ${planTab === 'personal' ? 'dash-tab--active' : ''}`} onClick={() => setPlanTab('personal')}>Personal</button>
                </div>
                <button className="dash-btn-primary" onClick={() => navigate('/tasks')}>
                  <Plus size={15} /> Add Task
                </button>
              </div>
            </div>
            <div className="dash-task-list">
              {filteredFocus.length > 0 ? filteredFocus.map((task, i) => (
                <div className="dash-task-row" key={task._id || i}>
                  <button
                    className="dash-task-checkbox"
                    aria-label={`Mark "${task.title}" as done`}
                    disabled={completingId === task._id}
                    onClick={() => handleCompleteTask(task._id)}
                  ></button>
                  <div className="dash-task-content">
                    <div className="dash-task-title">{task.title}</div>
                    {(task.dueDate || task.duration) ? (
                      <div className="dash-task-meta">
                        {task.dueDate ? (
                          <span className="dash-task-chip">
                            <Calendar size={12} />
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : null}
                        {task.duration ? (
                          <span className="dash-task-chip">
                            <Clock size={12} />
                            {task.duration} min
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="dash-task-right">
                    <span className={`dash-badge dash-badge--${task.priority?.toLowerCase() || 'medium'}`}>{task.priority || 'medium'}</span>
                    <button
                      className="dash-icon-btn"
                      aria-label="Start a focus session"
                      onClick={() => navigate('/study')}
                    >
                      <Play size={13} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="dash-empty">
                  <CheckSquare size={24} />
                  <p>No {planTab} tasks yet</p>
                  <button className="dash-btn-primary" onClick={() => navigate('/tasks')}>Create one</button>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Insight */}
          {aiInsight && !insightDismissed && (
            <motion.div className="dash-insight-card" variants={itemVariants}>
              <div className="dash-insight__icon"><Sparkles size={16} /></div>
              <div className="dash-insight__content">
                <p>{aiInsight}</p>
                <div className="dash-insight__actions">
                  <button className="dash-btn-ghost" onClick={() => setInsightDismissed(true)}>Dismiss</button>
                  <button
                    className="dash-insight__cta"
                    onClick={() => navigate('/tasks')}
                  >
                    View tasks <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Triple Row */}
          <motion.div className="dash-triple-grid" variants={itemVariants}>

            <div className="dash-card dash-card--chart">
              <div className="dash-card__header">This Week</div>
              {hasChartData ? (
                <div className="dash-chart-stack">
                  <ChartPanel
                    data={weekly}
                    dataKey="tasks"
                    name="Tasks done"
                    label="Tasks done"
                    swatch="tasks"
                    color="var(--series-1)"
                    total={weekTasks}
                    showAxis={false}
                    variant="bar"
                    isEmpty={weekTasks === 0}
                    emptyText="No tasks completed this week"
                  />
                  <ChartPanel
                    data={weekly}
                    dataKey="focus"
                    name="Focus (h)"
                    label="Focus time"
                    swatch="focus"
                    color="var(--series-2)"
                    total={weekFocusLabel}
                    showAxis
                    variant="area"
                    isEmpty={weekFocus === 0}
                    emptyText="No focus sessions this week"
                  />
                </div>
              ) : (
                <div className="dash-empty">
                  <Zap size={24} />
                  <p>No activity this week yet</p>
                </div>
              )}
            </div>

            <div className="dash-card dash-card--actions">
              <div className="dash-card__header">Quick Actions</div>
              <div className="dash-quick-actions">
                <button className="dash-qa-btn" onClick={() => navigate('/notes')}>
                  <span className="dash-qa-icon"><FileText size={22} strokeWidth={1.7} /></span>
                  <span className="dash-qa-label">New Note</span>
                  <kbd className="dash-qa-kbd">{MOD_KEY}N</kbd>
                </button>
                <button className="dash-qa-btn" onClick={() => navigate('/tasks')}>
                  <span className="dash-qa-icon"><CheckSquare size={22} strokeWidth={1.7} /></span>
                  <span className="dash-qa-label">Add Task</span>
                  <kbd className="dash-qa-kbd">{MOD_KEY}T</kbd>
                </button>
                <button className="dash-qa-btn dash-qa-btn--ai" onClick={() => navigate('/assistant')}>
                  <span className="dash-qa-icon"><Sparkles size={22} strokeWidth={1.7} /></span>
                  <span className="dash-qa-label">Ask AI</span>
                  <kbd className="dash-qa-kbd">{MOD_KEY}A</kbd>
                </button>
                <button className="dash-qa-btn" onClick={() => navigate('/goals')}>
                  <span className="dash-qa-icon"><Target size={22} strokeWidth={1.7} /></span>
                  <span className="dash-qa-label">Set Goal</span>
                  <kbd className="dash-qa-kbd">{MOD_KEY}G</kbd>
                </button>
              </div>
            </div>

            <div className="dash-card dash-card--recent">
              <div className="dash-card__header dash-card__header--row">
                <span>Recent Activity</span>
                {activity.length > 0 && <span className="dash-section__count">{activity.length}</span>}
              </div>
              <div className="dash-timeline">
                {activity.length > 0 ? activity.map(item => (
                  <div className={`dash-tl-item dash-tl-item--${item.kind}`} key={item.id}>
                    <span className="dash-tl-icon">
                      {item.kind === 'task' ? <Check size={12} strokeWidth={2.5} /> : <FileText size={12} />}
                    </span>
                    <div className="dash-tl-content">
                      <div className="dash-tl-title">{item.title}</div>
                      <div className="dash-tl-time">{item.time}</div>
                    </div>
                  </div>
                )) : (
                  <div className="dash-empty">
                    <Clock size={20} />
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
              <div className="dash-cal-title">
                <span className="dash-cal-month">{monthName}</span>
                <span className="dash-cal-year">{calYear}</span>
              </div>
              <div className="dash-cal-nav">
                {monthOffset !== 0 && (
                  <button className="dash-cal-today" onClick={() => setMonthOffset(0)}>Today</button>
                )}
                <button aria-label="Previous month" onClick={() => setMonthOffset(o => o - 1)}>
                  <ChevronLeft size={15} />
                </button>
                <button aria-label="Next month" onClick={() => setMonthOffset(o => o + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <div className="dash-cal-grid">
              {WEEKDAY_LABELS.map((d, i) => <div key={i} className="dash-cal-day-head">{d}</div>)}
              {leadingDays.map(d => (
                <div key={`lead-${d}`} className="dash-cal-day dash-cal-day--muted" aria-hidden="true">{d}</div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const weekday = (firstWeekday + i) % 7
                const isToday = isCurrentMonth && day === today.getDate()
                const events = eventCounts.get(day) || 0
                const inBand = isCurrentMonth && day >= bandStart && day <= bandEnd
                const classes = [
                  'dash-cal-day',
                  isToday && 'dash-cal-day--today',
                  events > 0 && 'dash-cal-day--has-task',
                  (monthIsPast || (isCurrentMonth && day < today.getDate())) && 'dash-cal-day--past',
                  (weekday === 0 || weekday === 6) && 'dash-cal-day--weekend',
                  inBand && 'dash-cal-day--week',
                  inBand && day === bandStart && 'dash-cal-day--week-start',
                  inBand && day === bandEnd && 'dash-cal-day--week-end',
                ].filter(Boolean).join(' ')
                return (
                  <div key={day} className={classes} data-events={Math.min(events, 3) || undefined}>
                    {day}
                  </div>
                )
              })}
              {Array.from({ length: trailingCount }).map((_, i) => (
                <div key={`trail-${i}`} className="dash-cal-day dash-cal-day--muted" aria-hidden="true">{i + 1}</div>
              ))}
            </div>

            <div className="dash-cal-agenda">
              <div className="dash-cal-agenda-head">Up next</div>
              {upNext.length > 0 ? upNext.map((ev, i) => (
                <div className="dash-cal-event" key={ev._id || i}>
                  <span className="dash-cal-event-bar" />
                  <div className="dash-cal-event-body">
                    <div className="dash-cal-event-title">{ev.title}</div>
                    <div className="dash-cal-event-time">{formatEventWhen(ev)}</div>
                  </div>
                </div>
              )) : (
                <div className="dash-cal-agenda-empty">No upcoming events</div>
              )}
            </div>
          </motion.div>

          <motion.div className="dash-card dash-card--focus" variants={itemVariants}>
            <div className="dash-card__header">Daily Focus</div>
            <div className="dash-focus-ring-container">
              <svg viewBox="0 0 100 100" className="dash-focus-svg">
                <defs>
                  {/* Cuts the ring into gauge ticks. A mask (not a painted
                      overlay) so the ticks stay correct on a glass card. */}
                  <mask id="dashFocusTicks" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="12" strokeDasharray="3.633 1.6" />
                  </mask>
                </defs>
                <circle cx="50" cy="50" r="40" className="dash-focus-bg" />
                <motion.circle
                  cx="50" cy="50" r="40" className="dash-focus-stroke"
                  initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: prefersReducedMotion ? 0 : 1.1, ease: 'easeOut', delay: 0.15 }}
                />
              </svg>
              <div className="dash-focus-center">
                <span className="dash-focus-val">{formatMinutes(focusMins)}</span>
                <span className="dash-focus-lbl">of {formatMinutes(DAILY_FOCUS_TARGET_MIN)} target</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="dash-card dash-card--goals" variants={itemVariants}>
            <div className="dash-card__header dash-card__header--row">
              <span>Active Goals</span>
              {(stats.activeGoals ?? activeGoalsList.length) > 0 && (
                <span className="dash-section__count">{stats.activeGoals ?? activeGoalsList.length}</span>
              )}
              <button className="dash-card__link" onClick={() => navigate('/goals')}>
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="dash-aside-goals">
              {activeGoalsList.length > 0 ? activeGoalsList.map(g => {
                const pct = Math.min(Math.max(g.progress ?? 0, 0), 100)
                return (
                  <div className="dash-ag-item" key={g._id}>
                    <span className="dash-ag-ring" style={{ '--p': pct }}>
                      <span className="dash-ag-ring-val">{pct}<small>%</small></span>
                    </span>
                    <div className="dash-ag-body">
                      <span className="dash-ag-title">{g.title}</span>
                      <span className="dash-ag-meta">of milestones done</span>
                    </div>
                  </div>
                )
              }) : (
                <div className="dash-empty">
                  <Target size={24} />
                  <p>No active goals</p>
                  <button className="dash-btn-primary" onClick={() => navigate('/goals')}>Set a goal</button>
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
          >
            <Sparkles size={20} strokeWidth={1.8} className="dash-am-spark" />
            <div className="dash-am-content">
              <span>Ready to assist.</span>
              <MessageSquare size={20} strokeWidth={1.8} />
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  )
}
