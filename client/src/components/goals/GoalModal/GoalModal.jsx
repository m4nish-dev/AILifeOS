import { useEffect, useState } from 'react'
import { X, Plus, Check, Trash2, Target, Calendar, Flag } from 'lucide-react'
import { GOAL_CATEGORIES } from '../../../data/mockGoalsFull'
import './GoalModal.css'

const emptyGoal = {
  title: '', description: '', category: 'career', status: 'active',
  progress: 0, startDate: '', dueDate: '', color: 'green', icon: 'code', milestones: [],
}

const COLORS = ['green', 'coffee', 'amber', 'red', 'blue']

export default function GoalModal({ open, goal, onClose, onSave, onDelete }) {
  const isEdit = Boolean(goal)
  const [form, setForm] = useState(emptyGoal)
  const [newMilestone, setNewMilestone] = useState('')

  useEffect(() => {
    if (goal) setForm({ ...emptyGoal, ...goal })
    else setForm(emptyGoal)
    setNewMilestone('')
  }, [goal, open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addMilestone = () => {
    if (!newMilestone.trim()) return
    update('milestones', [...form.milestones, { id: `m${Date.now()}`, title: newMilestone.trim(), done: false, week: form.milestones.length + 1 }])
    setNewMilestone('')
  }
  const toggleMilestone = (id) => {
    update('milestones', form.milestones.map(m => m.id === id ? { ...m, done: !m.done } : m))
  }
  const removeMilestone = (id) => {
    update('milestones', form.milestones.filter(m => m.id !== id))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const doneMS = form.milestones.filter(m => m.done).length
    const totalMS = form.milestones.length
    const computedProgress = totalMS ? Math.round((doneMS / totalMS) * 100) : form.progress
    const payload = isEdit ? { ...form, progress: computedProgress } : { ...form, id: `g${Date.now()}`, progress: computedProgress }
    onSave(payload, isEdit)
  }

  return (
    <div className="gm__backdrop" onClick={onClose}>
      <div className="gm" onClick={(e) => e.stopPropagation()}>
        <div className={`gm__head gm__head--${form.color}`}>
          <div>
            <div className="gm__badge"><Target size={11} strokeWidth={2.5} /> {isEdit ? 'Edit Goal' : 'New Goal'}</div>
            <h2 className="gm__title">{isEdit ? form.title : 'Create a new goal'}</h2>
          </div>
          <button className="gm__close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="gm__form">
          <div className="gm__body">
            <div className="gm__left">
              <div className="gm__field">
                <label>Title</label>
                <input className="gm__input gm__input--lg" placeholder="e.g. Frontend Job Ready in 30 days"
                  value={form.title} onChange={(e) => update('title', e.target.value)} autoFocus required />
              </div>

              <div className="gm__field">
                <label>Description</label>
                <textarea className="gm__textarea" placeholder="What does success look like?" rows={3}
                  value={form.description} onChange={(e) => update('description', e.target.value)} />
              </div>

              <div className="gm__field">
                <label>Milestones ({form.milestones.filter(m => m.done).length}/{form.milestones.length})</label>
                {form.milestones.length > 0 && (
                  <ul className="gm__milestones">
                    {form.milestones.map((m) => (
                      <li key={m.id} className={`gm__ms${m.done ? ' gm__ms--done' : ''}`}>
                        <button type="button" className={`gm__ms-check${m.done ? ' gm__ms-check--on' : ''}`} onClick={() => toggleMilestone(m.id)}>
                          {m.done && <Check size={12} strokeWidth={3} />}
                        </button>
                        <span className="gm__ms-text">{m.title}</span>
                        <span className="gm__ms-week">Week {m.week}</span>
                        <button type="button" className="gm__ms-del" onClick={() => removeMilestone(m.id)}><Trash2 size={12} /></button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="gm__add-row">
                  <input className="gm__input" placeholder="Add a milestone" value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMilestone() } }} />
                  <button type="button" className="gm__add-btn" onClick={addMilestone}><Plus size={14} strokeWidth={2.5} /></button>
                </div>
              </div>
            </div>

            <div className="gm__right">
              <div className="gm__field">
                <label>Category</label>
                <select className="gm__select" value={form.category} onChange={(e) => update('category', e.target.value)}>
                  {GOAL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div className="gm__field">
                <label>Status</label>
                <div className="gm__pills">
                  {['active', 'on-track', 'at-risk', 'paused', 'completed'].map(s => (
                    <button type="button" key={s}
                      className={`gm__pill${form.status === s ? ' gm__pill--active' : ''}`}
                      onClick={() => update('status', s)}>
                      {s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gm__field">
                <label>Color</label>
                <div className="gm__colors">
                  {COLORS.map(c => (
                    <button type="button" key={c}
                      className={`gm__color gm__color--${c}${form.color === c ? ' gm__color--active' : ''}`}
                      onClick={() => update('color', c)} />
                  ))}
                </div>
              </div>

              <div className="gm__field-row">
                <div className="gm__field">
                  <label><Calendar size={12} /> Start Date</label>
                  <input type="date" className="gm__input" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
                </div>
                <div className="gm__field">
                  <label><Flag size={12} /> Due Date</label>
                  <input type="date" className="gm__input" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="gm__foot">
            {isEdit && (
              <button type="button" className="gm__btn gm__btn--danger" onClick={() => onDelete(goal.id)}>
                <Trash2 size={14} /> Delete
              </button>
            )}
            <div className="gm__foot-right">
              <button type="button" className="gm__btn gm__btn--ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="gm__btn gm__btn--primary" disabled={!form.title.trim()}>
                <Check size={14} strokeWidth={2.5} />
                {isEdit ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
