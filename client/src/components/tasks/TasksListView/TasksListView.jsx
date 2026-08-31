import { Clock, Calendar, MoreVertical, CheckCircle2, Circle, Trash2, Pencil } from 'lucide-react'
import { priorityColor } from '../../../utils/priorityColors'
import { categoryColor, statusColor } from '../../../utils/categoryColors'
import { dueLabel, dueTone } from '../../../utils/taskDate'
import { PRIORITY_LABEL } from '../../../utils/constants'
import { STATUS_LABEL } from '../../../data/mockTasksFull'
import './TasksListView.css'

export default function TasksListView({ tasks, onEdit, onToggleDone, onDelete }) {
  return (
    <div className="tlv">
      <div className="tlv__head">
        <div className="tlv__col tlv__col--check"></div>
        <div className="tlv__col tlv__col--title">Task</div>
        <div className="tlv__col tlv__col--cat">Category</div>
        <div className="tlv__col tlv__col--status">Status</div>
        <div className="tlv__col tlv__col--priority">Priority</div>
        <div className="tlv__col tlv__col--due">Due</div>
        <div className="tlv__col tlv__col--time">Time</div>
        <div className="tlv__col tlv__col--actions"></div>
      </div>

      <div className="tlv__body">
        {tasks.map((task) => {
          const pc = priorityColor(task.priority)
          const cc = categoryColor(task.category)
          const sc = statusColor(task.status)
          const dLabel = dueLabel(task.dueDate)
          const dTone  = dueTone(task.dueDate, task.status)
          const isDone = task.status === 'done'

          return (
            <div
              key={task.id}
              className={`tlv__row${isDone ? ' tlv__row--done' : ''}`}
              onClick={() => onEdit(task)}
            >
              <div className="tlv__col tlv__col--check">
                <button
                  className={`tlv__check${isDone ? ' tlv__check--on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onToggleDone(task) }}
                  aria-label="Toggle done"
                >
                  {isDone
                    ? <CheckCircle2 size={20} strokeWidth={2} fill="var(--green-600)" color="#fff" />
                    : <Circle size={20} strokeWidth={1.7} />}
                </button>
              </div>

              <div className="tlv__col tlv__col--title">
                <div className="tlv__title-text">{task.title}</div>
                <div className="tlv__project">{task.project}</div>
              </div>

              <div className="tlv__col tlv__col--cat">
                <span
                  className="tlv__badge"
                  style={{ background: cc.bg, color: cc.fg }}
                >
                  <span className="tlv__dot" style={{ background: cc.dot }} />
                  {task.category}
                </span>
              </div>

              <div className="tlv__col tlv__col--status">
                <span
                  className="tlv__badge"
                  style={{ background: sc.bg, color: sc.fg }}
                >
                  <span className="tlv__dot" style={{ background: sc.dot }} />
                  {STATUS_LABEL[task.status]}
                </span>
              </div>

              <div className="tlv__col tlv__col--priority">
                <span
                  className="tlv__badge tlv__badge--pri"
                  style={{ background: pc.bg, color: pc.fg }}
                >
                  {PRIORITY_LABEL[task.priority]}
                </span>
              </div>

              <div className="tlv__col tlv__col--due">
                {dLabel && (
                  <span className={`tlv__due tlv__due--${dTone}`}>
                    <Calendar size={12} />
                    {dLabel}
                  </span>
                )}
              </div>

              <div className="tlv__col tlv__col--time">
                <span className="tlv__time">
                  <Clock size={12} />
                  {task.duration}m
                </span>
              </div>

              <div className="tlv__col tlv__col--actions">
                <button
                  className="tlv__action"
                  onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                  aria-label="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="tlv__action tlv__action--danger"
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
                  aria-label="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
