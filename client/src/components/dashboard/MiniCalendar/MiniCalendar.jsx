import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './MiniCalendar.css'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function buildMonth(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function MiniCalendar() {
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const cells = buildMonth(view.y, view.m)
  const isCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth()

  const change = (delta) => {
    let m = view.m + delta, y = view.y
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setView({ y, m })
  }

  return (
    <div className="mcal">
      <div className="mcal__head">
        <span className="mcal__title">
          {MONTHS[view.m]} {view.y}
        </span>
        <div className="mcal__nav">
          <button onClick={() => change(-1)}><ChevronLeft size={14} /></button>
          <button onClick={() => change(1)}><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="mcal__grid mcal__grid--days">
        {DAYS.map(d => <span key={d} className="mcal__dow">{d}</span>)}
      </div>

      <div className="mcal__grid">
        {cells.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            className={`mcal__cell${
              isCurrentMonth && d === today.getDate() ? ' mcal__cell--today' : ''
            }${!d ? ' mcal__cell--empty' : ''}`}
          >
            {d || ''}
          </button>
        ))}
      </div>
    </div>
  )
}
