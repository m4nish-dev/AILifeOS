import { useState, useRef, useEffect } from 'react'
import { Code2, Briefcase, Brain, BookOpen, Activity, Target, MoreVertical, Calendar, CheckCircle2, Edit2, Trash2 } from 'lucide-react'
import './GoalCard.css'

const ICONS = { code: Code2, briefcase: Briefcase, brain: Brain, book: BookOpen, activity: Activity }

const STATUS_LABEL = {
  'active': 'Active',
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  'completed': 'Completed',
  'paused': 'Paused',
}

// Status identity: a small square + the label (never colour alone).
const STATUS_MARK = {
  'active': 'orange',
  'on-track': 'brown',
  'at-risk': 'red',
  'completed': 'dark',
  'paused': 'taupe',
}

export default function GoalCard({ goal, onClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const Icon = ICONS[goal.icon] || Target
  const doneMilestones = goal.milestones?.filter(m => m.done).length || 0
  const totalMilestones = goal.milestones?.length || 0

  // No due date -> NaN, which previously fell through to "Overdue".
  const due = goal.dueDate ? new Date(goal.dueDate) : null
  const daysLeft = due && !Number.isNaN(due.getTime())
    ? Math.round((due - new Date()) / (1000 * 60 * 60 * 24))
    : null
  const dueLabel = goal.status === 'completed'
    ? 'Completed'
    : daysLeft === null
      ? 'No due date'
      : daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'

  const dueTone = goal.status !== 'completed' && daysLeft !== null
    ? (daysLeft < 0 ? 'danger' : daysLeft <= 7 ? 'warn' : '')
    : ''

  return (
    <article
      className="gc"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
    >
      <div className="gc__head">
        <span className="gc__status">
          <span className={`ui-mark ui-mark--${STATUS_MARK[goal.status] || 'taupe'}`} />
          {STATUS_LABEL[goal.status] || goal.status}
        </span>
        <div className="gc__menu-wrap" ref={menuRef}>
          <button
            className="gc__more"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            aria-label="Goal actions"
            aria-expanded={showMenu}
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <div className="gc__menu" role="menu">
              <button role="menuitem" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onClick() }}>
                <Edit2 size={13} /> Edit
              </button>
              {onDelete && (
                <button role="menuitem" className="gc__menu-danger" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(goal.id || goal._id) }}>
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="gc__body">
        <span className="gc__icon"><Icon size={16} strokeWidth={1.8} /></span>
        <div className="gc__text">
          <h3 className="gc__title">{goal.title}</h3>
          {goal.description && <p className="gc__desc">{goal.description}</p>}
        </div>
      </div>

      <div className="gc__progress">
        <div className="gc__progress-row">
          <span className="ui-label">Progress</span>
          <span className="gc__progress-value">{goal.progress}%</span>
        </div>
        <div className="gc__bar"><span style={{ width: `${goal.progress}%` }} /></div>
      </div>

      <div className="gc__foot">
        <span className="gc__meta">
          <CheckCircle2 size={13} />
          {doneMilestones}/{totalMilestones} milestones
        </span>
        <span className={`gc__meta${dueTone ? ` gc__meta--${dueTone}` : ''}`}>
          <Calendar size={13} />
          {dueLabel}
        </span>
      </div>
    </article>
  )
}
