import { CheckCircle2, PlusCircle, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { recentActivity } from '../../../data/mockStats'
import './RecentActivity.css'

const ICONS = {
  done:    { i: CheckCircle2, c: 'green' },
  created: { i: PlusCircle,   c: 'blue' },
  goal:    { i: TrendingUp,   c: 'coffee' },
  ai:      { i: Sparkles,     c: 'amber' },
}

export default function RecentActivity() {
  return (
    <div className="ra">
      <div className="ra__head">
        <h4>Recent Activity</h4>
        <button className="ra__all">View all <ArrowRight size={12} /></button>
      </div>
      <ul className="ra__list">
        {recentActivity.map((a) => {
          const { i: Icon, c } = ICONS[a.type]
          return (
            <li key={a.id} className={`ra__item ra__item--${c}`}>
              <div className="ra__icon"><Icon size={14} strokeWidth={2.2} /></div>
              <span className="ra__text">{a.text}</span>
              <span className="ra__time">{a.time}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
