import { Target } from 'lucide-react';
import './StudyGoalCard.css';

export default function StudyGoalCard({ goal }) {
  const met = goal.progress >= 100;
  return (
    <div className="study-goal-card">
      <div className="study-goal-card__header">
        <Target size={15} strokeWidth={1.8} className="study-goal-card__icon" />
        <span className="study-goal-card__subject">{goal.subject}</span>
        {met && <span className="study-goal-card__met"><span className="ui-mark ui-mark--dark" /> Met</span>}
      </div>

      <div className="study-goal-card__stats">
        <span>{goal.actual} of {goal.target} min</span>
        <span className="study-goal-card__pct">{goal.progress}%</span>
      </div>

      <div className="study-goal-card__progress">
        <span
          className={`study-goal-card__progress-fill${met ? ' study-goal-card__progress-fill--met' : ''}`}
          style={{ width: `${Math.min(100, goal.progress)}%` }}
        />
      </div>
    </div>
  );
}
