import { useState } from 'react'
import { Plus } from 'lucide-react'
import { STATUSES, STATUS_LABEL } from '../../../data/mockTasksFull'
import TaskCard from '../TaskCard/TaskCard'
import './TasksKanbanView.css'

const COLUMN_ACCENTS = {
  'todo':        'grey',
  'in-progress': 'blue',
  'review':      'coffee',
  'done':        'green',
}

export default function TasksKanbanView({ tasks, onEdit, onStatusChange, onCreate }) {
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const grouped = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s)
    return acc
  }, {})

  const handleDrop = (status) => {
    if (dragId) {
      const task = tasks.find(t => t.id === dragId)
      if (task && task.status !== status) {
        onStatusChange(task, status)
      }
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div className="kb">
      {STATUSES.map((status) => {
        const items = grouped[status]
        const accent = COLUMN_ACCENTS[status]

        return (
          <div
            key={status}
            className={`kb__col kb__col--${accent}${overCol === status ? ' kb__col--over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOverCol(status) }}
            onDragLeave={() => setOverCol(null)}
            onDrop={() => handleDrop(status)}
          >
            <div className="kb__col-head">
              <div className="kb__col-title">
                <span className="kb__col-dot" />
                <span>{STATUS_LABEL[status]}</span>
                <span className="kb__col-count">{items.length}</span>
              </div>
              <button
                className="kb__col-add"
                onClick={() => onCreate(status)}
                aria-label="Add task to column"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="kb__col-body">
              {items.length === 0 ? (
                <div className="kb__empty">
                  <span>No tasks</span>
                  <button onClick={() => onCreate(status)}>
                    <Plus size={12} /> Add task
                  </button>
                </div>
              ) : (
                items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onEdit(task)}
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                    isDragging={dragId === task.id}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
