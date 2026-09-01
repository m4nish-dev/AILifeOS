import './FocusPatternHeatmap.css';

export default function FocusPatternHeatmap({ data }) {
  // data = [{ hour: 0, minutes: 45 }, { hour: 1, minutes: 0 }, ... up to 23]
  if (!data || data.length === 0) return null;

  const maxMinutes = Math.max(...data.map(d => d.minutes), 1); // Avoid division by zero

  const formatHour = (h) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  return (
    <div className="focus-heatmap">
      <div className="focus-heatmap__grid">
        {data.map((d) => {
          const intensity = d.minutes / maxMinutes;
          // Colors from very light blue to deep blue
          const bgColor = d.minutes === 0 
            ? 'var(--surface-200)' 
            : `rgba(var(--blue-500-rgb), ${Math.max(0.2, intensity)})`;

          return (
            <div key={d.hour} className="focus-heatmap__cell-wrap" title={`${formatHour(d.hour)}: ${d.minutes} mins`}>
              <div 
                className="focus-heatmap__cell" 
                style={{ background: bgColor }}
              />
              {d.hour % 3 === 0 && (
                <div className="focus-heatmap__label">{formatHour(d.hour)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
