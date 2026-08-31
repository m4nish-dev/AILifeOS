import { useState } from 'react'
import { Play, Plus, Filter } from 'lucide-react'
import { todaysTasks } from '../../../data/mockTasks'
import { priorityColor } from '../../../utils/priorityColors'
import { PRIORITY_LABEL } from '../../../utils/constants'
import './TodaysPlan.css'

const TABS = ['Today', 'This Week', 'All']

export default function TodaysPlan() {
  const [tab, setTab] = useState('Today')

  return (
    <section className="plan">
      <header className="plan__head">
        <div className="plan__title">
          <div className="plan__title-icon">
            <Filter size={15} />
          </div>
          <h3>Today's Plan</h3>
        </div>

        <div className="plan__actions">
          <div className="plan__tabs">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`plan__tab${tab === t ? ' plan__tab--active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="plan__add">
            <Plus size={15} strokeWidth={2.4} />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      <ul className="plan__list">
        {todaysTasks.map((task) => {
          const c = priorityColor(task.priority)
          return (
            <li key={task.id} className="plan__row">
              <span className="plan__time">{task.time}</span>

              <div
                className="plan__bar"
                style={{ background: c.dot }}
              />

              <div className="plan__main">
                <div className="plan__title-text">{task.title}</div>
                <div className="plan__project">
                  <span className="plan__project-dot" style={{ background: c.dot }} />
                  {task.project}
                </div>
              </div>

              <span className="plan__dur">{task.duration} min</span>

              <span
                className="plan__priority"
                style={{ background: c.bg, color: c.fg }}
              >
                {PRIORITY_LABEL[task.priority]}
              </span>

              <button className="plan__play" aria-label="Start task">
                <Play size={13} fill="currentColor" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
