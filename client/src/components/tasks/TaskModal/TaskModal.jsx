import { useEffect, useState } from 'react'
import {
  X, Calendar, Clock, Flag, Folder, AlignLeft,
  Plus, Trash2, Check, Tag, Sparkles, Target, Loader2
} from 'lucide-react'
import { STATUSES, STATUS_LABEL, CATEGORIES } from '../../../data/mockTasksFull'
import api from '../../../services/api'
import { taskService } from '../../../services/taskService'
import { useToast } from '../../../context/ToastContext'
import './TaskModal.css'

const PRIORITIES = ['high', 'medium', 'low']

const emptyTask = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  category: 'development',
  project: '',
  dueDate: '',
  time: '',
  duration: 30,
  tags: [],
  subtasks: [],
}

export default function TaskModal({ open, task, initialStatus, isSaving, onClose, onSave, onDelete }) {
  const isEdit = Boolean(task)
  const [form, setForm] = useState(emptyTask)
  const [newSub, setNewSub] = useState('')
  const [newTag, setNewTag] = useState('')
  const [goals, setGoals] = useState([])
  const { showToast } = useToast()

  useEffect(() => {
    if (open) {
      api.get('/goals').then(res => setGoals(res.data.data)).catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (task) {
      setForm({ ...emptyTask, ...task })
    } else {
      setForm({ ...emptyTask, status: initialStatus || 'todo' })
    }
    setNewSub('')
    setNewTag('')
  }, [task, initialStatus, open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const addSubtask = () => {
    if (!newSub.trim()) return
    update('subtasks', [
      ...(form.subtasks || []),
      { id: `s${Date.now()}`, text: newSub.trim(), done: false },
    ])
    setNewSub('')
  }
  const toggleSubtask = (id) => {
    update('subtasks',
      form.subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s))
  }
  const removeSubtask = (id) => {
    update('subtasks', form.subtasks.filter(s => s.id !== id))
  }
  const addTag = () => {
    const t = newTag.trim().toLowerCase()
    if (!t || form.tags?.includes(t)) return
    update('tags', [...(form.tags || []), t])
    setNewTag('')
  }
  const removeTag = (t) => update('tags', form.tags.filter(x => x !== t))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = isEdit
      ? { ...form }
      : { ...form, id: `t${Date.now()}` }
    await onSave(payload, isEdit)
  }

  const handleSchedule = async () => {
    if (!form.dueDate || !form.time) {
      showToast('Please set a due date and time first', 'error')
      return
    }
    try {
      const start = new Date(`${form.dueDate}T${form.time}`)
      const end = new Date(start.getTime() + (form.duration || 30) * 60000)
      const updated = await taskService.scheduleTask(task.id || task._id, start.toISOString(), end.toISOString())
      setForm(prev => ({ ...prev, eventId: updated.eventId }))
      showToast('Scheduled on Calendar!', 'success')
    } catch (err) {
      showToast('Failed to schedule', 'error')
    }
  }

  const doneSubs = form.subtasks?.filter(s => s.done).length || 0
  const totalSubs = form.subtasks?.length || 0

  return (
    <div className="tm__backdrop" onClick={onClose}>
      <div
        className="tm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="tm__head">
          <div className="tm__head-left">
            <div className="tm__badge">
              <Sparkles size={11} strokeWidth={2.5} />
              {isEdit ? 'Edit Task' : 'New Task'}
            </div>
            <h2 className="tm__title">
              {isEdit ? 'Update task details' : 'Create a new task'}
            </h2>
          </div>
          <button className="tm__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="tm__form">
          <div className="tm__body">
            {/* Left column */}
            <div className="tm__left">
              <div className="tm__field">
                <label>Title</label>
                <input
                  className="tm__input tm__input--lg"
                  placeholder="e.g. Complete Backend API"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="tm__field">
                <label>
                  <AlignLeft size={13} />
                  Description
                </label>
                <textarea
                  className="tm__textarea"
                  placeholder="Add more details about this task…"
                  rows={4}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </div>

              {/* Subtasks */}
              <div className="tm__field">
                <label>
                  <Check size={13} />
                  Subtasks
                  {totalSubs > 0 && (
                    <span className="tm__label-count">
                      {doneSubs}/{totalSubs}
                    </span>
                  )}
                </label>

                {totalSubs > 0 && (
                  <ul className="tm__subs">
                    {form.subtasks.map((s) => (
                      <li key={s.id} className={`tm__sub${s.done ? ' tm__sub--done' : ''}`}>
                        <button
                          type="button"
                          className={`tm__sub-check${s.done ? ' tm__sub-check--on' : ''}`}
                          onClick={() => toggleSubtask(s.id)}
                        >
                          {s.done && <Check size={11} strokeWidth={3} />}
                        </button>
                        <span className="tm__sub-text">{s.text}</span>
                        <button
                          type="button"
                          className="tm__sub-del"
                          onClick={() => removeSubtask(s.id)}
                          aria-label="Delete subtask"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="tm__add-row">
                  <input
                    className="tm__input"
                    placeholder="Add a subtask"
                    value={newSub}
                    onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addSubtask() }
                    }}
                  />
                  <button
                    type="button"
                    className="tm__add-btn"
                    onClick={addSubtask}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="tm__field">
                <label>
                  <Tag size={13} />
                  Tags
                </label>
                {form.tags?.length > 0 && (
                  <div className="tm__tags">
                    {form.tags.map((t) => (
                      <span key={t} className="tm__tag">
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          aria-label={`Remove ${t}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="tm__add-row">
                  <input
                    className="tm__input"
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag() }
                    }}
                  />
                  <button
                    type="button"
                    className="tm__add-btn"
                    onClick={addTag}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="tm__right">
              <div className="tm__field">
                <label>Status</label>
                <div className="tm__pills">
                  {STATUSES.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`tm__pill${form.status === s ? ' tm__pill--active' : ''}`}
                      onClick={() => update('status', s)}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tm__field">
                <label>
                  <Flag size={13} />
                  Priority
                </label>
                <div className="tm__pills">
                  {PRIORITIES.map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`tm__pill tm__pill--${p}${form.priority === p ? ' tm__pill--active' : ''}`}
                      onClick={() => update('priority', p)}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tm__field">
                <label>
                  <Folder size={13} />
                  Category
                </label>
                <select
                  className="tm__select"
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="tm__field">
                <label>Project</label>
                <input
                  className="tm__input"
                  placeholder="e.g. AI LifeOS Project"
                  value={form.project}
                  onChange={(e) => update('project', e.target.value)}
                />
              </div>

              <div className="tm__field">
                <label>
                  <Target size={13} />
                  Link to Goal
                </label>
                <select
                  className="tm__select"
                  value={form.goalId || ''}
                  onChange={(e) => update('goalId', e.target.value)}
                >
                  <option value="">None</option>
                  {goals.map(g => (
                    <option key={g._id || g.id} value={g._id || g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="tm__field-row">
                <div className="tm__field">
                  <label>
                    <Calendar size={13} />
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="tm__input"
                    value={form.dueDate}
                    onChange={(e) => update('dueDate', e.target.value)}
                  />
                </div>
                <div className="tm__field">
                  <label>
                    <Clock size={13} />
                    Time
                  </label>
                  <input
                    type="time"
                    className="tm__input"
                    value={form.time}
                    onChange={(e) => update('time', e.target.value)}
                  />
                </div>
              </div>

              <div className="tm__field">
                <label>Duration (minutes)</label>
                <div className="tm__duration">
                  <input
                    type="number"
                    min="5"
                    step="5"
                    className="tm__input"
                    value={form.duration}
                    onChange={(e) => update('duration', Number(e.target.value))}
                  />
                  <div className="tm__duration-quick">
                    {[15, 30, 60, 90].map(m => (
                      <button
                        type="button"
                        key={m}
                        className={`tm__dur-btn${form.duration === m ? ' tm__dur-btn--active' : ''}`}
                        onClick={() => update('duration', m)}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isEdit && (
                <div className="tm__field">
                  <button 
                    type="button" 
                    className="tm__btn tm__btn--secondary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleSchedule}
                    disabled={!!form.eventId}
                  >
                    <Calendar size={14} />
                    {form.eventId ? '📅 Scheduled' : 'Schedule on Calendar'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="tm__foot">
            {isEdit && (
              <button
                type="button"
                className="tm__btn tm__btn--danger"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
            <div className="tm__foot-right">
              <button
                type="button"
                className="tm__btn tm__btn--ghost"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tm__btn tm__btn--primary"
                disabled={!form.title.trim() || isSaving}
              >
                {isSaving ? <Loader2 size={14} className="an-spin" /> : <Check size={14} strokeWidth={2.5} />}
                {isSaving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Task')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
