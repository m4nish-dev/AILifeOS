import { Wand2, Target, Timer } from 'lucide-react'
import './QuickActions.css'

const actions = [
  { key: 'plan',  label: 'Plan My Day',  icon: Wand2,  color: 'green' },
  { key: 'goal',  label: 'Create Goal',  icon: Target, color: 'coffee' },
  { key: 'focus', label: 'Focus Mode',   icon: Timer,  color: 'red' },
]

export default function QuickActions() {
  return (
    <div className="qa">
      <div className="qa__head"><h4>Quick Actions</h4></div>
      <div className="qa__grid">
        {actions.map(({ key, label, icon: Icon, color }) => (
          <button key={key} className={`qa__btn qa__btn--${color}`}>
            <div className="qa__icon"><Icon size={18} strokeWidth={2.2} /></div>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
