import { Target, Code2, Briefcase, Brain, ArrowRight } from 'lucide-react'
import { activeGoals } from '../../../data/mockGoals'
import './ActiveGoalsPanel.css'

const ICONS = { code: Code2, briefcase: Briefcase, brain: Brain }
const COLORS = ['green', 'coffee', 'red']

export default function ActiveGoalsPanel() {
  return (
    <div className="agoals">
      <div className="agoals__head">
        <div className="agoals__title">
          <Target size={14} />
          <h4>Active Goals</h4>
        </div>
        <button className="agoals__all">View all <ArrowRight size={12} /></button>
      </div>

      <ul className="agoals__list">
        {activeGoals.map((g, i) => {
          const Icon = ICONS[g.icon] || Target
          const color = COLORS[i % COLORS.length]
          return (
            <li key={g.id} className={`agoals__item agoals__item--${color}`}>
              <div className="agoals__icon"><Icon size={15} /></div>
              <div className="agoals__meta">
                <div className="agoals__row-1">
                  <span className="agoals__name">{g.title}</span>
                  <span className="agoals__pct">{g.progress}%</span>
                </div>
                <div className="agoals__bar">
                  <div
                    className="agoals__bar-fill"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
                <div className="agoals__sub">{g.sub}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
