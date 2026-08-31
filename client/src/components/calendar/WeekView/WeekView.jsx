import './WeekView.css'

const DAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM - 8 PM

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getWeekDays(date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d
  })
}

export default function WeekView({ currentDate, events, onEventClick, onSlotClick, onDrop }) {
  const days = getWeekDays(currentDate)
  const today = new Date()

  const handleDrop = (e, day, hour) => {
    e.preventDefault()
    const eventId = e.dataTransfer.getData('eventId')
    if (eventId && onDrop) {
      const newStart = new Date(day)
      newStart.setHours(hour, 0, 0, 0)
      onDrop(eventId, newStart)
    }
  }

  return (
    <div className="wv">
      <div className="wv__header">
        <div className="wv__time-col-head"></div>
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className={`wv__day-head${isToday ? ' wv__day-head--today' : ''}`}>
              <span className="wv__day-name">{DAYS_FULL[day.getDay()]}</span>
              <span className={`wv__day-num${isToday ? ' wv__day-num--today' : ''}`}>{day.getDate()}</span>
            </div>
          )
        })}
      </div>

      <div className="wv__body">
        <div className="wv__time-col">
          {HOURS.map(h => (
            <div key={h} className="wv__time-slot">
              <span>{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</span>
            </div>
          ))}
        </div>

        {days.map((day) => (
          <div key={day.toISOString()} className="wv__day-col">
            {HOURS.map(h => {
              const slotEvents = events.filter(e => {
                const start = new Date(e.start)
                return isSameDay(start, day) && start.getHours() === h
              })
              return (
                <div
                  key={h}
                  className="wv__slot"
                  onClick={() => {
                    const d = new Date(day); d.setHours(h, 0, 0, 0)
                    onSlotClick(d)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, day, h)}
                >
                  {slotEvents.map((event) => {
                    const start = new Date(event.start)
                    const end = new Date(event.end)
                    const durationMin = (end - start) / 60000
                    const heightPct = Math.min(100, (durationMin / 60) * 100)
                    return (
                      <div
                        key={event.id}
                        className={`wv__event wv__event--${event.color}`}
                        style={{ height: `${heightPct}%` }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('eventId', event.id)}
                      >
                        <div className="wv__event-title">{event.title}</div>
                        <div className="wv__event-time">
                          {start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} –
                          {' '}{end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
