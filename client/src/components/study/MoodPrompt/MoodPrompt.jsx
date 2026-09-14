import { useState } from 'react';
import './MoodPrompt.css';

export default function MoodPrompt({ onSelect }) {
  const options = [
    { id: 'great', emoji: '🤩', label: 'Great' },
    { id: 'good', emoji: '🙂', label: 'Good' },
    { id: 'ok', emoji: '😐', label: 'Okay' },
    { id: 'struggling', emoji: '😫', label: 'Struggling' }
  ];

  return (
    <div className="mood-prompt">
      <h3>Session complete! How did you feel?</h3>
      <div className="mood-prompt__options">
        {options.map(opt => (
          <button 
            key={opt.id} 
            className="mood-prompt__btn" 
            onClick={() => onSelect(opt.id)}
          >
            <span className="mood-prompt__emoji">{opt.emoji}</span>
            <span className="mood-prompt__label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
