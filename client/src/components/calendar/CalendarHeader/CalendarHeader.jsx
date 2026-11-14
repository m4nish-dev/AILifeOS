import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import PageHeader from '../../common/PageHeader/PageHeader'
import './CalendarHeader.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarHeader({ view, onViewChange, currentDate, onNavigate, onToday, onCreate, eventCount = 0 }) {
  const label = view === 'month'
    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : view === 'week'
    ? getWeekLabel(currentDate)
    : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <PageHeader
      title={label}
      subtitle={`${eventCount} event${eventCount !== 1 ? 's' : ''} in view`}
    >
      <div className="ui-seg" role="group" aria-label="Navigate">
        <button className="ui-seg__btn ch__step" onClick={() => onNavigate(-1)} aria-label="Previous"><ChevronLeft size={15} /></button>
        <button className="ui-seg__btn" onClick={onToday}>Today</button>
        <button className="ui-seg__btn ch__step" onClick={() => onNavigate(1)} aria-label="Next"><ChevronRight size={15} /></button>
      </div>
      <div className="ui-seg" role="group" aria-label="View">
        {['month', 'week', 'day'].map(v => (
          <button
            key={v}
            className={`ui-seg__btn${view === v ? ' ui-seg__btn--active' : ''}`}
            onClick={() => onViewChange(v)}
            aria-pressed={view === v}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <button className="ui-btn ui-btn--primary" onClick={() => onCreate()}>
        <Plus size={14} strokeWidth={2.4} />
        New Event
      </button>
    </PageHeader>
  )
}

function getWeekLabel(date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
