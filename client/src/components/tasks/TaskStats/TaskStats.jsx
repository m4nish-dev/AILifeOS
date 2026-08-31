import { ListTodo, Loader, CheckCircle2, AlertTriangle } from 'lucide-react'
import { daysUntil } from '../../../utils/taskDate'
import './TaskStats.css'

export default function TaskStats({ tasks }) {
  const total = tasks.length
  const inProgress = tasks.filter(t => t.status === 'in-progress').length
  const done = tasks.filter(t => t.status === 'done').length
  const overdue = tasks.filter(t => t.status !== 'done' && daysUntil(t.dueDate) < 0).length
  const completion = total ? Math.round((done / total) * 100) : 0

  const items = [
    { key: 'total',   label: 'Total Tasks',  value: total,      icon: ListTodo,      color: 'green', sub: `${completion}% completed` },
    { key: 'progress',label: 'In Progress',  value: inProgress, icon: Loader,        color: 'coffee', sub: 'Active right now' },
    { key: 'done',    label: 'Completed',    value: done,       icon: CheckCircle2,  color: 'green-dark', sub: 'Great work!' },
    { key: 'overdue', label: 'Overdue',      value: overdue,    icon: AlertTriangle, color: 'red', sub: overdue ? 'Needs attention' : 'All clear' },
  ]

  return (
    <div className="ts">
      {items.map(({ key, label, value, icon: Icon, color, sub }) => (
        <div key={key} className={`ts__card ts__card--${color}`}>
          <div className="ts__row">
            <div className="ts__icon"><Icon size={16} strokeWidth={2.2} /></div>
            <span className="ts__label">{label}</span>
          </div>
          <div className="ts__value">{String(value).padStart(2, '0')}</div>
          <div className="ts__sub">{sub}</div>
        </div>
      ))}
    </div>
  )
}
