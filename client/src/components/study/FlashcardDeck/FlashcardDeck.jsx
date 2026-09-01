import { Book } from 'lucide-react';
import './FlashcardDeck.css';

export default function FlashcardDeck({ deckName, total, due, onClick }) {
  return (
    <button className="flashcard-deck" onClick={onClick}>
      <div className="flashcard-deck__header">
        <div className="flashcard-deck__icon">
          <Book size={20} strokeWidth={2} />
        </div>
        <h3 className="flashcard-deck__title">{deckName}</h3>
      </div>
      
      <div className="flashcard-deck__stats">
        <div className="flashcard-deck__stat">
          <span className="flashcard-deck__stat-val">{total}</span>
          <span className="flashcard-deck__stat-lbl">Cards</span>
        </div>
        <div className="flashcard-deck__stat">
          <span className={`flashcard-deck__stat-val ${due > 0 ? 'text-amber-500' : 'text-green-500'}`}>
            {due}
          </span>
          <span className="flashcard-deck__stat-lbl">Due</span>
        </div>
      </div>
    </button>
  );
}
