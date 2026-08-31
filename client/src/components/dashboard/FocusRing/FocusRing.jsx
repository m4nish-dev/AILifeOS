import { focusBreakdown } from '../../../data/mockStats'
import './FocusRing.css'

export default function FocusRing() {
  const total = focusBreakdown.reduce((s, x) => s + x.hours, 0)
  const R = 42
  const C = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="ring-card">
      <div className="ring-card__head">
        <h4>Today's Focus</h4>
      </div>

      <div className="ring-card__body">
        <div className="ring-card__ring">
          <svg viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={R} className="ring-card__track" />
            {focusBreakdown.map((seg, i) => {
              const frac = seg.hours / total
              const len = frac * C
              const el = (
                <circle
                  key={i}
                  cx="55" cy="55" r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="10"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 55 55)"
                  strokeLinecap="butt"
                />
              )
              offset += len
              return el
            })}
          </svg>
          <div className="ring-card__center">
            <span className="ring-card__num">{total.toFixed(1)}h</span>
            <span className="ring-card__label">Focus Time</span>
          </div>
        </div>

        <ul className="ring-card__legend">
          {focusBreakdown.map((seg) => (
            <li key={seg.label}>
              <span className="ring-card__dot" style={{ background: seg.color }} />
              <span className="ring-card__legend-label">{seg.label}</span>
              <span className="ring-card__legend-val">{seg.hours}h</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
