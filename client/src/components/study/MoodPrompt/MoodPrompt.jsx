import { Smile, Meh, Frown } from 'lucide-react';
import './MoodPrompt.css';

export default function MoodPrompt({ onSelect }) {
  const options = [
    { id: 'great', icon: <Smile size={24} />, label: 'Great' },
    { id: 'good', icon: <Smile size={24} />, label: 'Good' },
    { id: 'ok', icon: <Meh size={24} />, label: 'Okay' },
    { id: 'struggling', icon: <Frown size={24} />, label: 'Struggling' }
  ];

  return (
    <div className="mood-prompt">
      <h3>Session complete! How did you feel?</h3>
      <div className="mood-prompt__options">
        {options.map(opt => (
          <button
            key={opt.id}
            className="mp__btn"
            onClick={() => onSelect(opt.id)}
          >
            <div className="mp__emoji">{opt.icon}</div>
            <div className="mp__label">{opt.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
