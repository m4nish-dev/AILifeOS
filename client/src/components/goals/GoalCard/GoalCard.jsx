import { Code2, Briefcase, Brain, BookOpen, Activity, Target, MoreVertical, Calendar, CheckCircle2 } from 'lucide-react'
import './GoalCard.css'

const ICONS = { code: Code2, briefcase: Briefcase, brain: Brain, book: BookOpen, activity: Activity }

const STATUS_LABEL = {
  'active': 'Active',
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  'completed': 'Completed',
  'paused': 'Paused',
}

const STATUS_COLOR = {
  'active': 'blue',
  'on-track': 'green',
  'at-risk': 'red',
  'completed': 'green-dark',
  'paused': 'coffee',
}

export default function GoalCard({ goal, onClick }) {
  const Icon = ICONS[goal.icon] || Target
  const doneMilestones = goal.milestones?.filter(m => m.done).length || 0
  const totalMilestones = goal.milestones?.length || 0

  const daysLeft = Math.round((new Date(goal.dueDate) - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <div className={`gc gc--${goal.color}`} onClick={onClick}>
      <div className="gc__accent" />

      <div className="gc__head">
        <div className="gc__icon"><Icon size={20} strokeWidth={2} /></div>
        <span className={`gc__status gc__status--${STATUS_COLOR[goal.status]}`}>
          {STATUS_LABEL[goal.status]}
        </span>
        <button className="gc__more" onClick={(e) => e.stopPropagation()}>
          <MoreVertical size={14} />
        </button>
      </div>

      <h3 className="gc__title">{goal.title}</h3>
      <p className="gc__desc">{goal.description}</p>

      <div className="gc__progress">
        <div className="gc__progress-row">
          <span className="gc__progress-label">Progress</span>
          <span className="gc__progress-value">{goal.progress}%</span>
        </div>
        <div className="gc__progress-bar">
          <div className="gc__progress-fill" style={{ width: `${goal.progress}%` }} />
        </div>
      </div>

      <div className="gc__meta">
        <div className="gc__meta-item">
          <CheckCircle2 size={12} />
          <span>{doneMilestones}/{totalMilestones} milestones</span>
        </div>
        <div className="gc__meta-item">
          <Calendar size={12} />
          <span>{daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'}</span>
        </div>
      </div>
    </div>
  )
}
