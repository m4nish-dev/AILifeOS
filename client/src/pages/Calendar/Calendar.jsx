import { useCallback, useEffect, useState } from 'react'
import CalendarHeader from '../../components/calendar/CalendarHeader/CalendarHeader'
import MonthView from '../../components/calendar/MonthView/MonthView'
import WeekView from '../../components/calendar/WeekView/WeekView'
import DayView from '../../components/calendar/DayView/DayView'
import EventModal from '../../components/calendar/EventModal/EventModal'
import Skeleton from '../../components/common/Skeleton/Skeleton'
import EmptyState from '../../components/common/EmptyState/EmptyState'
import { eventService } from '../../services/eventService'
import { useToast } from '../../context/ToastContext'
import { Calendar as CalendarIcon } from 'lucide-react'
import './Calendar.css'

export default function Calendar() {
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  
  const [apiLoading, setApiLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [initialDate, setInitialDate] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  const fetchEvents = useCallback(async () => {
    try {
      setApiLoading(true)
      // Get the first day of the current month and the last day, padding by a week to ensure full grid coverage
      const d = new Date(currentDate)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      start.setDate(start.getDate() - 7)
      
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      end.setDate(end.getDate() + 7)
      
      const data = await eventService.getEventsByRange(start.toISOString(), end.toISOString())
      setEvents(data)
    } catch (err) {
      console.error('Failed to fetch events:', err)
    } finally {
      setApiLoading(false)
    }
  }, [currentDate])

  useEffect(() => { fetchEvents() }, [fetchEvents])

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

  const handleSave = async (eventData, isEdit) => {
    setIsSaving(true)
    try {
      if (isEdit) {
        const updated = await eventService.updateEvent(eventData.id || eventData._id, eventData)
        setEvents(prev => prev.map(e => (e.id === updated.id || e._id === updated._id) ? updated : e))
        showToast('Event updated successfully', 'success')
      } else {
        const created = await eventService.createEvent(eventData)
        setEvents(prev => [...prev, created])
        showToast('Event created successfully', 'success')
      }
      setModalOpen(false); setEditingEvent(null); setInitialDate(null)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save event', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      await eventService.deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id && e._id !== id))
      showToast('Event deleted', 'success')
      setModalOpen(false); setEditingEvent(null)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete event', 'error')
    }
  }

  const handleDrop = async (eventId, newStart) => {
    // Optimistic UI update
    let updatedEndIso = ''
    let updatedStartIso = newStart.toISOString()
    
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId && e._id !== eventId) return e
      const oldStart = new Date(e.start), oldEnd = new Date(e.end)
      const duration = oldEnd - oldStart
      const newEnd = new Date(newStart.getTime() + duration)
      updatedEndIso = newEnd.toISOString()
      return { ...e, start: newStart, end: newEnd }
    }))

    try {
      // Backend sync
      await eventService.moveEvent(eventId, updatedStartIso, updatedEndIso)
      showToast('Event moved', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to move event', 'error')
      fetchEvents() // Revert on failure
    }
  }

  return (
    <div className="cal-page">
      <CalendarHeader
        view={view} onViewChange={setView}
        currentDate={currentDate} onNavigate={navigate}
        onToday={() => setCurrentDate(new Date())}
        onCreate={openCreate}
      />

      {apiLoading && events.length === 0 ? (
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: 12, flex: 1 }}>
          <Skeleton variant="card" height="100%" count={35} />
        </div>
      ) : (
        <>
          {events.length === 0 && (
            <div style={{ padding: '12px 24px', background: 'rgba(var(--blue-500-rgb), 0.1)', color: 'var(--blue-600)', textAlign: 'center', fontSize: 13, borderBottom: '1px solid var(--border-subtle)' }}>
              No events scheduled for this period. Click any slot to add one.
            </div>
          )}
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
        </>
      )}

      <EventModal
        open={modalOpen} event={editingEvent} initialDate={initialDate}
        isSaving={isSaving}
        onClose={() => { setModalOpen(false); setEditingEvent(null); setInitialDate(null) }}
        onSave={handleSave} onDelete={handleDelete}
      />
    </div>
  )
}
