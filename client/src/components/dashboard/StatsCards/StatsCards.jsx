import { ListChecks, TrendingUp, Timer, Target } from 'lucide-react'
import { dashboardStats } from '../../../data/mockStats'
import './StatsCards.css'

const cards = [
  {
    key: 'tasksToday',
    label: 'Tasks Today',
    icon: ListChecks,
    accent: 'green',
    format: (v) => String(v).padStart(2, '0'),
  },
  {
    key: 'weeklyCompletion',
    label: 'Weekly Completion',
    icon: TrendingUp,
    accent: 'coffee',
    format: (v) => `${v}%`,
    ring: true,
  },
  {
    key: 'focusTime',
    label: 'Focus Time',
    icon: Timer,
    accent: 'red',
    format: (v) => `${v}h`,
  },
  {
    key: 'activeGoals',
    label: 'Active Goals',
    icon: Target,
    accent: 'green-dark',
    format: (v) => String(v).padStart(2, '0'),
  },
]

export default function StatsCards() {
  return (
    <div className="stats">
      {cards.map(({ key, label, icon: Icon, accent, format, ring }) => {
        const data = dashboardStats[key]
        return (
          <div key={key} className={`stat stat--${accent}`}>
            <div className="stat__head">
              <div className="stat__icon">
                <Icon size={16} strokeWidth={2.2} />
              </div>
              <span className="stat__label">{label}</span>
            </div>

            <div className="stat__body">
              <div className="stat__value">{format(data.value)}</div>
              {ring && (
                <div className="stat__ring">
                  <svg viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" className="stat__ring-bg" />
                    <circle
                      cx="20" cy="20" r="16"
                      className="stat__ring-fg"
                      strokeDasharray={`${(data.value / 100) * 100.5} 100.5`}
                      transform="rotate(-90 20 20)"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="stat__sub">
              {data.trend === 'up' && <span className="stat__arrow">↑</span>}
              {data.sub}
            </div>
          </div>
        )
      })}
    </div>
  )
}
