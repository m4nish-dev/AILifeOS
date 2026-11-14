import './StatGrid.css'

/**
 * KPI cards in the dashboard language. Each item:
 *   { key, label, value, unit?, icon?, sub?, progress? (0–100), alert? }
 * `alert` turns the card red — only pass it when something needs attention.
 */
export default function StatGrid({ items, columns = 4 }) {
  return (
    <div className="sg" style={{ '--sg-cols': columns }}>
      {items.map(({ key, label, value, unit, icon: Icon, sub, progress, alert }) => (
        <div key={key || label} className={`sg__card${alert ? ' sg__card--alert' : ''}`}>
          <div className="sg__head">
            {Icon && <Icon size={16} strokeWidth={1.8} className="sg__icon" />}
            <span className="sg__label">{label}</span>
          </div>
          <div className="sg__value">
            {value}
            {unit && <span className="sg__unit">{unit}</span>}
          </div>
          {progress !== undefined ? (
            <div className="sg__bar" aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
            </div>
          ) : (
            <div className="sg__bar sg__bar--blank" aria-hidden="true" />
          )}
          {sub && <div className="sg__sub">{sub}</div>}
        </div>
      ))}
    </div>
  )
}
