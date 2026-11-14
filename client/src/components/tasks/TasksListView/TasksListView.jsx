import { Check, Trash2, Pencil } from 'lucide-react'
import { priorityColor } from '../../../utils/priorityColors'
import { categoryColor } from '../../../utils/categoryColors'
import { dueLabel, dueTone } from '../../../utils/taskDate'
import { PRIORITY_LABEL } from '../../../utils/constants'
import { STATUS_LABEL, CATEGORIES } from '../../../data/mockTasksFull'
import './TasksListView.css'

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]))

export default function TasksListView({ tasks, onEdit, onToggleDone, onDelete }) {
  return (
    <div className="tlv" role="table" aria-label="Tasks">
      <div className="tlv__head" role="row">
        <span role="columnheader" aria-label="Done" />
        <span role="columnheader">Task</span>
        <span role="columnheader" className="tlv__c-cat">Category</span>
        <span role="columnheader" className="tlv__c-status">Status</span>
        <span role="columnheader">Priority</span>
        <span role="columnheader" className="tlv__c-due">Due</span>
        <span role="columnheader" className="tlv__c-time">Time</span>
        <span role="columnheader" aria-label="Actions" />
      </div>

      {tasks.map((task) => {
        const pc = priorityColor(task.priority)
        const cc = categoryColor(task.category)
        const dLabel = dueLabel(task.dueDate)
        const dTone = dueTone(task.dueDate, task.status)
        const isDone = task.status === 'done'

        return (
          <div
            key={task.id}
            role="row"
            className={`tlv__row${isDone ? ' tlv__row--done' : ''}`}
            onClick={() => onEdit(task)}
          >
            <span role="cell">
              <button
                className={`tlv__check${isDone ? ' tlv__check--on' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleDone(task) }}
                aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
              >
                {isDone && <Check size={11} strokeWidth={3} />}
              </button>
            </span>

            <span role="cell" className="tlv__task">
              <span className="tlv__title">{task.title}</span>
              {task.project && <span className="tlv__project">{task.project}</span>}
            </span>

            <span role="cell" className="tlv__c-cat">
              <span className="tlv__tag">
                <span className="tlv__dot" style={{ background: cc.dot }} />
                {CATEGORY_LABEL[task.category] || task.category}
              </span>
            </span>

            <span role="cell" className="tlv__c-status">
              <span className="tlv__tag">
                <span className={`tlv__status-mark tlv__status-mark--${task.status}`} />
                {STATUS_LABEL[task.status]}
              </span>
            </span>

            <span role="cell">
              <span className={`tlv__pri tlv__pri--${task.priority}`}>
                <span className="tlv__pri-mark" style={{ background: pc.dot }} />
                {PRIORITY_LABEL[task.priority]}
              </span>
            </span>

            <span role="cell" className={`tlv__c-due tlv__due tlv__due--${dTone}`}>
              {dLabel || <span className="tlv__none">—</span>}
            </span>

            <span role="cell" className="tlv__c-time tlv__time">
              {task.duration ? `${task.duration} min` : <span className="tlv__none">—</span>}
            </span>

            <span role="cell" className="tlv__actions">
              <button
                className="tlv__action"
                onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                aria-label={`Edit "${task.title}"`}
              >
                <Pencil size={13} />
              </button>
              <button
                className="tlv__action tlv__action--danger"
                onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
                aria-label={`Delete "${task.title}"`}
              >
                <Trash2 size={13} />
              </button>
            </span>
          </div>
        )
      })}
    </div>
  )
}
