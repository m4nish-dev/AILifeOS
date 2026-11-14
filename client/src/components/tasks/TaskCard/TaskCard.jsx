import { Clock, Calendar } from 'lucide-react'
import { priorityColor } from '../../../utils/priorityColors'
import { categoryColor } from '../../../utils/categoryColors'
import { dueLabel, dueTone } from '../../../utils/taskDate'
import { PRIORITY_LABEL } from '../../../utils/constants'
import { CATEGORIES } from '../../../data/mockTasksFull'
import './TaskCard.css'

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]))

export default function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging }) {
  const pc = priorityColor(task.priority)
  const cc = categoryColor(task.category)
  const dLabel = dueLabel(task.dueDate)
  const dTone = dueTone(task.dueDate, task.status)

  const doneSubs = task.subtasks?.filter(s => s.done).length || 0
  const totalSubs = task.subtasks?.length || 0

  return (
    <div
      className={`tc${isDragging ? ' tc--dragging' : ''}${task.status === 'done' ? ' tc--done' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
    >
      <div className="tc__head">
        <span className="tc__category">
          <span className="tc__cat-dot" style={{ background: cc.dot }} />
          {CATEGORY_LABEL[task.category] || task.category}
        </span>
        <span className={`tc__priority tc__priority--${task.priority}`}>
          <span className="tc__pri-mark" style={{ background: pc.dot }} />
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>

      <h4 className="tc__title">{task.title}</h4>
      {task.description && <p className="tc__desc">{task.description}</p>}

      {totalSubs > 0 && (
        <div className="tc__subs">
          <div className="tc__subs-bar">
            <span style={{ width: `${(doneSubs / totalSubs) * 100}%` }} />
          </div>
          <span className="tc__subs-label">{doneSubs}/{totalSubs}</span>
        </div>
      )}

      {(dLabel || task.duration) && (
        <div className="tc__foot">
          {dLabel && (
            <span className={`tc__meta tc__due--${dTone}`}>
              <Calendar size={12} />
              {dLabel}
            </span>
          )}
          {task.duration ? (
            <span className="tc__meta">
              <Clock size={12} />
              {task.duration} min
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}
