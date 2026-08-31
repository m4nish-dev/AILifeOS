import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon } from 'lucide-react'
import './CalendarHeader.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarHeader({ view, onViewChange, currentDate, onNavigate, onToday, onCreate }) {
  const label = view === 'month'
    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : view === 'week'
    ? getWeekLabel(currentDate)
    : `${currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`

  return (
    <div className="ch">
      <div className="ch__left">
        <div className="ch__nav">
          <button onClick={() => onNavigate(-1)} aria-label="Previous"><ChevronLeft size={16} /></button>
          <button onClick={onToday} className="ch__today">Today</button>
          <button onClick={() => onNavigate(1)} aria-label="Next"><ChevronRight size={16} /></button>
        </div>
        <h1 className="ch__title">{label}</h1>
      </div>

      <div className="ch__right">
        <div className="ch__view">
          {['month', 'week', 'day'].map(v => (
            <button
              key={v}
              className={`ch__view-btn${view === v ? ' ch__view-btn--active' : ''}`}
              onClick={() => onViewChange(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button className="ch__create" onClick={() => onCreate()}>
          <Plus size={15} strokeWidth={2.5} /><span>New Event</span>
        </button>
      </div>
    </div>
  )
}

function getWeekLabel(date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
