import { Target, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'
import './GoalStats.css'

export default function GoalStats({ goals }) {
  const total = goals.length
  const onTrack = goals.filter(g => g.status === 'on-track' || g.status === 'active').length
  const completed = goals.filter(g => g.status === 'completed').length
  const atRisk = goals.filter(g => g.status === 'at-risk').length
  const avgProgress = total ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / total) : 0

  const items = [
    { key: 'total', label: 'Total Goals', value: total, icon: Target, color: 'green', sub: `${avgProgress}% avg progress` },
    { key: 'ontrack', label: 'On Track', value: onTrack, icon: TrendingUp, color: 'coffee', sub: 'Moving forward' },
    { key: 'done', label: 'Completed', value: completed, icon: CheckCircle2, color: 'green-dark', sub: 'Achievements unlocked' },
    { key: 'risk', label: 'At Risk', value: atRisk, icon: AlertCircle, color: 'red', sub: atRisk ? 'Needs focus' : 'All good' },
  ]

  return (
    <div className="gs">
      {items.map(({ key, label, value, icon: Icon, color, sub }) => (
        <div key={key} className={`gs__card gs__card--${color}`}>
          <div className="gs__row">
            <div className="gs__icon"><Icon size={16} strokeWidth={2.2} /></div>
            <span className="gs__label">{label}</span>
          </div>
          <div className="gs__value">{String(value).padStart(2, '0')}</div>
          <div className="gs__sub">{sub}</div>
        </div>
      ))}
    </div>
  )
}
