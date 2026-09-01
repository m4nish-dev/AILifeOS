import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Target, Clock, CheckCircle2, Flame, Loader2, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import analyticsService from '../../services/analyticsService'
import Skeleton from '../../components/common/Skeleton/Skeleton'
import EmptyState from '../../components/common/EmptyState/EmptyState'
import { Link } from 'react-router-dom'
import './Analytics.css'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [empty, setEmpty] = useState(false)
  const [range, setRange] = useState('Month')
  
  const [stats, setStats] = useState(null)
  const [weeklyData, setWeeklyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [goalsData, setGoalsData] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  const [insights, setInsights] = useState([])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    setEmpty(false)
    
    try {
      const [
        overviewRes,
        weeklyRes,
        categoryRes,
        goalsRes,
        heatmapRes,
        insightsRes
      ] = await Promise.all([
        analyticsService.getOverviewStats(),
        analyticsService.getWeeklyProductivity(),
        analyticsService.getCategoryBreakdown(),
        analyticsService.getGoalsProgress(),
        analyticsService.getActivityHeatmap(range === 'Week' ? 28 : (range === 'Month' ? 84 : 365)),
        analyticsService.getAIInsights()
      ])

      // Check if completely empty
      if (
        overviewRes.tasksCompleted === 0 &&
        overviewRes.focusHours === 0 &&
        overviewRes.goalsOnTrack === 0 &&
        categoryRes.length === 0
      ) {
        setEmpty(true)
      } else {
        setStats(overviewRes)
        setWeeklyData(weeklyRes)
        setCategoryData(categoryRes)
        setGoalsData(goalsRes)
        setHeatmapData(heatmapRes)
        setInsights(insightsRes)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [range])

  if (loading) {
    return (
      <div className="an-page">
        <div className="an-head">
          <div>
            <h1 className="an-head__title">Analytics</h1>
            <p className="an-head__sub">Crunching your data...</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          <Skeleton variant="card" height={100} count={4} />
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          <Skeleton variant="card" height={300} width="66%" />
          <Skeleton variant="card" height={300} width="34%" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="an-page">
        <div className="an-head">
          <h1 className="an-head__title">Analytics</h1>
        </div>
        <div className="an-error">
          <AlertCircle size={32} color="var(--red-500)" />
          <h2>{error}</h2>
          <button className="an-btn-retry" onClick={fetchAnalytics}>Retry</button>
        </div>
      </div>
    )
  }

  if (empty) {
    return (
      <div className="an-page">
        <div className="an-head">
          <h1 className="an-head__title">Analytics</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState
            icon={BarChart3}
            title="No data yet"
            description="Start tracking your tasks and study sessions to see your productivity insights."
          />
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Tasks Completed', value: stats.tasksCompleted, delta: stats.tasksCompletedDelta, icon: CheckCircle2, color: 'green' },
    { label: 'Focus Hours',     value: stats.focusHours, delta: stats.focusHoursDelta, icon: Clock, color: 'coffee' },
    { label: 'Goals On Track',  value: stats.goalsOnTrack, delta: '', icon: Target, color: 'blue' },
    { label: 'Streak Days',     value: stats.streakDays, delta: '', icon: Flame, color: 'red' },
  ]

  return (
    <div className="an-page">
      <div className="an-head">
        <div>
          <h1 className="an-head__title">Analytics</h1>
          <p className="an-head__sub">Your productivity, visualized.</p>
        </div>
        <div className="an-head__range">
          <button className={range === 'Week' ? 'an-head__range--active' : ''} onClick={() => setRange('Week')}>Week</button>
          <button className={range === 'Month' ? 'an-head__range--active' : ''} onClick={() => setRange('Month')}>Month</button>
          <button className={range === 'Year' ? 'an-head__range--active' : ''} onClick={() => setRange('Year')}>Year</button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="an-stats">
        {statCards.map(({ label, value, delta, icon: Icon, color }) => (
          <div key={label} className={`an-stat an-stat--${color}`}>
            <div className="an-stat__row">
              <div className="an-stat__icon"><Icon size={16} strokeWidth={2.2} /></div>
              {delta && (
                <span className={`an-stat__delta an-stat__delta--${delta.startsWith('+') ? 'up' : 'down'}`}>
                  {delta}
                </span>
              )}
            </div>
            <div className="an-stat__value">{value}</div>
            <div className="an-stat__label">{label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="an-grid">
        {/* Weekly productivity chart */}
        <div className="an-card an-card--wide">
          <div className="an-card__head">
            <div>
              <h3>Weekly Productivity</h3>
              <p>Tasks completed and focus hours per day</p>
            </div>
            <div className="an-legend">
              <span className="an-legend__item"><span style={{ background: '#0E8C5A' }}></span> Tasks</span>
              <span className="an-legend__item"><span style={{ background: '#7A4E2D' }}></span> Focus (hrs)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }} />
              <Bar dataKey="tasks" fill="#0E8C5A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="focus" fill="#7A4E2D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="an-card">
          <div className="an-card__head">
            <div>
              <h3>Time by Category</h3>
              <p>Where your effort goes (last 30 days)</p>
            </div>
          </div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="an-pie-legend">
                {categoryData.map(c => (
                  <div key={c.name} className="an-pie-legend__item">
                    <span style={{ background: c.color }}></span>
                    <span>{c.name}</span>
                    <strong>{c.value}%</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>No category data available</div>
          )}
        </div>

        {/* Goals progress */}
        <div className="an-card an-card--wide">
          <div className="an-card__head">
            <div>
              <h3>Goals Progress</h3>
              <p>Current state of all your active goals</p>
            </div>
          </div>
          <div className="an-goals">
            {goalsData.length > 0 ? goalsData.map(g => (
              <div key={g.name} className="an-goal">
                <div className="an-goal__head">
                  <span className="an-goal__name">{g.name}</span>
                  <span className="an-goal__pct">{g.progress}%</span>
                </div>
                <div className="an-goal__bar">
                  <div className="an-goal__fill" style={{ width: `${g.progress}%`, background: g.color || 'var(--green-500)' }} />
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--text-tertiary)' }}>No active goals found.</div>
            )}
          </div>
        </div>

        {/* Heatmap */}
        <div className="an-card">
          <div className="an-card__head">
            <div>
              <h3>Activity Heatmap</h3>
              <p>Your consistency map</p>
            </div>
          </div>
          <div className="an-heat">
            {heatmapData.map((d, i) => (
              <div key={i} className={`an-heat__cell an-heat__cell--${d.count}`} title={`${d.date}: ${d.count} activities`} />
            ))}
          </div>
          <div className="an-heat__legend">
            <span>Less</span>
            <div className="an-heat__scale">
              {[0, 1, 2, 3, 4].map(n => <div key={n} className={`an-heat__cell an-heat__cell--${n}`} />)}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Insights */}
        <div className="an-card an-card--full">
          <div className="an-card__head">
            <div>
              <h3>AI Insights</h3>
              <p>Personal observations from your data</p>
            </div>
          </div>
          <div className="an-insights">
            {insights.map((i, idx) => (
              <div key={idx} className={`an-insight an-insight--${i.color || 'blue'}`}>
                <div className="an-insight__icon">{i.icon}</div>
                <div>
                  <div className="an-insight__title">{i.title}</div>
                  <div className="an-insight__text">{i.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
