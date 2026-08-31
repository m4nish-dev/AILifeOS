import { Clock, Calendar, MoreVertical, CheckSquare } from 'lucide-react'
import { priorityColor } from '../../../utils/priorityColors'
import { categoryColor } from '../../../utils/categoryColors'
import { dueLabel, dueTone } from '../../../utils/taskDate'
import { PRIORITY_LABEL } from '../../../utils/constants'
import './TaskCard.css'

export default function TaskCard({ task, onClick, onDragStart, onDragEnd, isDragging }) {
  const pc = priorityColor(task.priority)
  const cc = categoryColor(task.category)
  const dLabel = dueLabel(task.dueDate)
  const dTone  = dueTone(task.dueDate, task.status)

  const doneSubs = task.subtasks?.filter(s => s.done).length || 0
  const totalSubs = task.subtasks?.length || 0

  return (
    <div
      className={`tc${isDragging ? ' tc--dragging' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="tc__accent" style={{ background: pc.dot }} />

      <div className="tc__head">
        <span
          className="tc__category"
          style={{ background: cc.bg, color: cc.fg }}
        >
          <span className="tc__cat-dot" style={{ background: cc.dot }} />
          {task.category}
        </span>
        <button
          className="tc__more"
          onClick={(e) => e.stopPropagation()}
          aria-label="More"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      <h4 className="tc__title">{task.title}</h4>
      {task.description && (
        <p className="tc__desc">{task.description}</p>
      )}

      {totalSubs > 0 && (
        <div className="tc__subs">
          <div className="tc__subs-head">
            <CheckSquare size={11} />
            <span>{doneSubs}/{totalSubs} subtasks</span>
          </div>
          <div className="tc__subs-bar">
            <div
              className="tc__subs-fill"
              style={{ width: `${(doneSubs / totalSubs) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="tc__foot">
        <div className="tc__meta">
          {dLabel && (
            <span className={`tc__due tc__due--${dTone}`}>
              <Calendar size={11} />
              {dLabel}
            </span>
          )}
          {task.duration && (
            <span className="tc__dur">
              <Clock size={11} />
              {task.duration}m
            </span>
          )}
        </div>
        <span
          className="tc__priority"
          style={{ background: pc.bg, color: pc.fg }}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>
    </div>
  )
}
