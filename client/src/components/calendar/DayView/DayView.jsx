import './DayView.css'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7)

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function DayView({ currentDate, events, onEventClick, onSlotClick, onDrop }) {
  const dayEvents = events.filter(e => isSameDay(new Date(e.start), currentDate))

  const handleDrop = (e, hour) => {
    e.preventDefault()
    const eventId = e.dataTransfer.getData('eventId')
    if (eventId && onDrop) {
      const newStart = new Date(currentDate); newStart.setHours(hour, 0, 0, 0)
      onDrop(eventId, newStart)
    }
  }

  return (
    <div className="dv">
      <div className="dv__side">
        <div className="dv__side-head">Today's Events</div>
        <div className="dv__side-list">
          {dayEvents.length === 0 ? (
            <div className="dv__empty">
              <p>No events scheduled</p>
            </div>
          ) : dayEvents.map(event => (
            <div
              key={event.id}
              className={`dv__side-event dv__side-event--${event.color}`}
              onClick={() => onEventClick(event)}
            >
              <div className="dv__side-time">
                {new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
              <div className="dv__side-title">{event.title}</div>
              <div className="dv__side-cat">{event.category}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dv__main">
        <div className="dv__grid">
          {HOURS.map(h => {
            const slotEvents = dayEvents.filter(e => new Date(e.start).getHours() === h)
            return (
              <div key={h} className="dv__row">
                <div className="dv__time">
                  {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                </div>
                <div
                  className="dv__slot"
                  onClick={() => {
                    const d = new Date(currentDate); d.setHours(h, 0, 0, 0); onSlotClick(d)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, h)}
                >
                  {slotEvents.map(event => {
                    const start = new Date(event.start), end = new Date(event.end)
                    const durationMin = (end - start) / 60000
                    return (
                      <div
                        key={event.id}
                        className={`dv__event dv__event--${event.color}`}
                        style={{ minHeight: `${Math.max(50, durationMin)}px` }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('eventId', event.id)}
                      >
                        <div className="dv__event-title">{event.title}</div>
                        <div className="dv__event-time">
                          {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} –
                          {' '}{end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
