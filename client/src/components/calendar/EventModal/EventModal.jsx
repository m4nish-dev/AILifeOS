import { useEffect, useState } from 'react'
import { X, Calendar, Clock, Tag, Trash2, Check, Loader2 } from 'lucide-react'
import { EVENT_CATEGORIES } from '../../../data/mockEvents'
import './EventModal.css'

const COLORS = ['green', 'coffee', 'amber', 'red', 'blue']

function toLocalDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventModal({ open, event, initialDate, isSaving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(event)
  const [form, setForm] = useState({ title: '', start: '', end: '', color: 'green', category: 'work' })

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        start: toLocalDateTime(event.start),
        end: toLocalDateTime(event.end),
        color: event.color,
        category: event.category,
      })
    } else if (initialDate) {
      const end = new Date(initialDate); end.setHours(end.getHours() + 1)
      setForm({
        title: '', start: toLocalDateTime(initialDate.toISOString()),
        end: toLocalDateTime(end.toISOString()), color: 'green', category: 'work',
      })
    }
  }, [event, initialDate, open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      ...(event || {}),
      id: event?.id || `e${Date.now()}`,
      title: form.title,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      color: form.color,
      category: form.category,
    }
    onSave(payload, isEdit)
  }

  return (
    <div className="em__backdrop" onClick={onClose}>
      <div className="em" onClick={(e) => e.stopPropagation()}>
        <div className={`em__head em__head--${form.color}`}>
          <div>
            <div className="em__badge">{isEdit ? 'Edit Event' : 'New Event'}</div>
            <h2 className="em__title">{isEdit ? form.title || 'Untitled' : 'Create a new event'}</h2>
          </div>
          <button className="em__close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="em__form">
          <div className="em__field">
            <label>Title</label>
            <input className="em__input em__input--lg" placeholder="e.g. Team standup"
              value={form.title} onChange={(e) => update('title', e.target.value)} autoFocus required />
          </div>

          <div className="em__field-row">
            <div className="em__field">
              <label><Calendar size={12} /> Starts</label>
              <input type="datetime-local" className="em__input" value={form.start}
                onChange={(e) => update('start', e.target.value)} required />
            </div>
            <div className="em__field">
              <label><Clock size={12} /> Ends</label>
              <input type="datetime-local" className="em__input" value={form.end}
                onChange={(e) => update('end', e.target.value)} required />
            </div>
          </div>

          <div className="em__field">
            <label><Tag size={12} /> Category</label>
            <select className="em__select" value={form.category} onChange={(e) => update('category', e.target.value)}>
              {EVENT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div className="em__field">
            <label>Color</label>
            <div className="em__colors">
              {COLORS.map(c => (
                <button type="button" key={c}
                  className={`em__color em__color--${c}${form.color === c ? ' em__color--active' : ''}`}
                  onClick={() => update('color', c)} />
              ))}
            </div>
          </div>

          <div className="em__foot">
            {isEdit && (
              <button type="button" className="em__btn em__btn--danger" onClick={() => onDelete(event.id)}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            <div className="em__foot-right">
              <button type="button" className="em__btn em__btn--ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
              <button type="submit" className="em__btn em__btn--primary" disabled={!form.title.trim() || isSaving}>
                {isSaving ? <Loader2 size={14} className="an-spin" /> : <Check size={14} strokeWidth={2.5} />}
                {isSaving ? 'Saving...' : (isEdit ? 'Save' : 'Create')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
