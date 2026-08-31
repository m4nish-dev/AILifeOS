import { BarChart3, TrendingUp, Target, Clock, CheckCircle2, Flame } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { weeklyProductivity, categoryBreakdown, goalsProgress, heatmapData, insights } from '../../data/mockAnalytics'
import './Analytics.css'

export default function Analytics() {
  const stats = [
    { label: 'Tasks Completed', value: 58, delta: '+12%', icon: CheckCircle2, color: 'green' },
    { label: 'Focus Hours',     value: '28.8', delta: '+18%', icon: Clock, color: 'coffee' },
    { label: 'Goals On Track',  value: 3, delta: '+1', icon: Target, color: 'blue' },
    { label: 'Streak Days',     value: 12, delta: 'Best!', icon: Flame, color: 'red' },
  ]

  return (
    <div className="an-page">
      <div className="an-head">
        <div>
          <h1 className="an-head__title">Analytics</h1>
          <p className="an-head__sub">Your productivity, visualized — the last 7 days.</p>
        </div>
        <div className="an-head__range">
          <button>Week</button>
          <button className="an-head__range--active">Month</button>
          <button>Year</button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="an-stats">
        {stats.map(({ label, value, delta, icon: Icon, color }) => (
          <div key={label} className={`an-stat an-stat--${color}`}>
            <div className="an-stat__row">
              <div className="an-stat__icon"><Icon size={16} strokeWidth={2.2} /></div>
              <span className={`an-stat__delta an-stat__delta--${delta.startsWith('+') || delta === 'Best!' ? 'up' : 'down'}`}>{delta}</span>
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
            <BarChart data={weeklyProductivity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
              <p>Where your effort goes</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryBreakdown} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="an-pie-legend">
            {categoryBreakdown.map(c => (
              <div key={c.name} className="an-pie-legend__item">
                <span style={{ background: c.color }}></span>
                <span>{c.name}</span>
                <strong>{c.value}%</strong>
              </div>
            ))}
          </div>
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
            {goalsProgress.map(g => (
              <div key={g.name} className="an-goal">
                <div className="an-goal__head">
                  <span className="an-goal__name">{g.name}</span>
                  <span className="an-goal__pct">{g.progress}%</span>
                </div>
                <div className="an-goal__bar">
                  <div className="an-goal__fill" style={{ width: `${g.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="an-card">
          <div className="an-card__head">
            <div>
              <h3>Activity Heatmap</h3>
              <p>Your last 12 weeks</p>
            </div>
          </div>
          <div className="an-heat">
            {heatmapData.map((d, i) => (
              <div key={i} className={`an-heat__cell an-heat__cell--${d.count}`} title={`${d.count} activities`} />
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
              <div key={idx} className={`an-insight an-insight--${i.color}`}>
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
