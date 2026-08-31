import { weeklyProductivity } from '../../../data/mockStats'
import './ProductivityOverview.css'

const TODAY_IDX = 1 // Tue highlighted in mock

export default function ProductivityOverview() {
  const max = Math.max(...weeklyProductivity.map(d => d.value))

  return (
    <div className="prod">
      <div className="prod__head">
        <h4>Productivity Overview</h4>
        <div className="prod__today">
          <span className="prod__today-label">Today</span>
          <span className="prod__today-value">
            {weeklyProductivity[TODAY_IDX].value}%
          </span>
        </div>
      </div>

      <div className="prod__chart">
        {weeklyProductivity.map((d, i) => {
          const h = (d.value / max) * 100
          const isToday = i === TODAY_IDX
          return (
            <div key={d.day} className="prod__col">
              <div className="prod__bar-wrap">
                <div
                  className={`prod__bar${isToday ? ' prod__bar--today' : ''}`}
                  style={{ height: `${h}%` }}
                />
              </div>
              <span className={`prod__day${isToday ? ' prod__day--today' : ''}`}>
                {d.day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
