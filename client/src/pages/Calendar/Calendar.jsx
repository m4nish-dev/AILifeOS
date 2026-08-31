import { useState } from 'react'
import CalendarHeader from '../../components/calendar/CalendarHeader/CalendarHeader'
import MonthView from '../../components/calendar/MonthView/MonthView'
import WeekView from '../../components/calendar/WeekView/WeekView'
import DayView from '../../components/calendar/DayView/DayView'
import EventModal from '../../components/calendar/EventModal/EventModal'
import { eventsData } from '../../data/mockEvents'
import './Calendar.css'

export default function Calendar() {
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState(eventsData)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [initialDate, setInitialDate] = useState(null)

  const navigate = (delta) => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + delta)
    else if (view === 'week') d.setDate(d.getDate() + delta * 7)
    else d.setDate(d.getDate() + delta)
    setCurrentDate(d)
  }

  const openCreate = (date) => {
    setEditingEvent(null)
    setInitialDate(date || new Date())
    setModalOpen(true)
  }

  const openEdit = (event) => {
    setEditingEvent(event); setInitialDate(null); setModalOpen(true)
  }

  const handleSave = (event, isEdit) => {
    if (isEdit) setEvents(prev => prev.map(e => e.id === event.id ? event : e))
    else setEvents(prev => [...prev, event])
    setModalOpen(false); setEditingEvent(null); setInitialDate(null)
  }

  const handleDelete = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    setModalOpen(false); setEditingEvent(null)
  }

  const handleDrop = (eventId, newStart) => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e
      const oldStart = new Date(e.start), oldEnd = new Date(e.end)
      const duration = oldEnd - oldStart
      const newEnd = new Date(newStart.getTime() + duration)
      return { ...e, start: newStart.toISOString(), end: newEnd.toISOString() }
    }))
  }

  return (
    <div className="cal-page">
      <CalendarHeader
        view={view} onViewChange={setView}
        currentDate={currentDate} onNavigate={navigate}
        onToday={() => setCurrentDate(new Date())}
        onCreate={openCreate}
      />

      {view === 'month' && (
        <MonthView currentDate={currentDate} events={events}
          onEventClick={openEdit} onDayClick={openCreate} onDrop={handleDrop} />
      )}
      {view === 'week' && (
        <WeekView currentDate={currentDate} events={events}
          onEventClick={openEdit} onSlotClick={openCreate} onDrop={handleDrop} />
      )}
      {view === 'day' && (
        <DayView currentDate={currentDate} events={events}
          onEventClick={openEdit} onSlotClick={openCreate} onDrop={handleDrop} />
      )}

      <EventModal
        open={modalOpen} event={editingEvent} initialDate={initialDate}
        onClose={() => { setModalOpen(false); setEditingEvent(null); setInitialDate(null) }}
        onSave={handleSave} onDelete={handleDelete}
      />
    </div>
  )
}
