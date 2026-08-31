import './MonthView.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildMonth(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), outside: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false })
  }
  const remaining = (7 - (cells.length % 7)) % 7
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), outside: true })
  }
  return cells
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function MonthView({ currentDate, events, onEventClick, onDayClick, onDrop }) {
  const cells = buildMonth(currentDate.getFullYear(), currentDate.getMonth())
  const today = new Date()

  const handleDragStart = (e, event) => {
    e.dataTransfer.setData('eventId', event.id)
  }
  const handleDrop = (e, date) => {
    e.preventDefault()
    const eventId = e.dataTransfer.getData('eventId')
    if (eventId && onDrop) onDrop(eventId, date)
  }

  return (
    <div className="mv">
      <div className="mv__weekdays">
        {DAYS.map(d => <div key={d} className="mv__weekday">{d}</div>)}
      </div>

      <div className="mv__grid">
        {cells.map((cell, i) => {
          const isToday = isSameDay(cell.date, today)
          const dayEvents = events.filter(e => isSameDay(new Date(e.start), cell.date))
          const visibleEvents = dayEvents.slice(0, 3)
          const overflow = dayEvents.length - 3

          return (
            <div
              key={i}
              className={`mv__cell${cell.outside ? ' mv__cell--outside' : ''}${isToday ? ' mv__cell--today' : ''}`}
              onClick={() => onDayClick(cell.date)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, cell.date)}
            >
              <div className="mv__cell-head">
                <span className={`mv__cell-num${isToday ? ' mv__cell-num--today' : ''}`}>
                  {cell.date.getDate()}
                </span>
              </div>
              <div className="mv__cell-events">
                {visibleEvents.map(event => (
                  <div
                    key={event.id}
                    className={`mv__event mv__event--${event.color}`}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                  >
                    <span className="mv__event-time">
                      {new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="mv__event-title">{event.title}</span>
                  </div>
                ))}
                {overflow > 0 && <div className="mv__overflow">+{overflow} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
