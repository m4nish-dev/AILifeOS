import { Target } from 'lucide-react';
import './StudyGoalCard.css';

export default function StudyGoalCard({ goal }) {
  return (
    <div className="study-goal-card">
      <div className="study-goal-card__header">
        <Target size={16} className="text-blue-500" />
        <span className="study-goal-card__subject">{goal.subject}</span>
      </div>
      
      <div className="study-goal-card__stats">
        <span>{goal.actual} / {goal.target} mins</span>
        <span className="study-goal-card__pct">{goal.progress}%</span>
      </div>
      
      <div className="study-goal-card__progress">
        <div 
          className="study-goal-card__progress-fill" 
          style={{ 
            width: `${goal.progress}%`,
            background: goal.progress >= 100 ? 'var(--green-500)' : 'var(--blue-500)'
          }} 
        />
      </div>
    </div>
  );
}
