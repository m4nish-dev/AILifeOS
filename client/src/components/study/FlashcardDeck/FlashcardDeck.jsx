import { Book, ArrowRight } from 'lucide-react';
import './FlashcardDeck.css';

export default function FlashcardDeck({ deckName, total, due, onClick }) {
  return (
    <button className="flashcard-deck" onClick={onClick}>
      <div className="flashcard-deck__header">
        <span className="flashcard-deck__icon"><Book size={16} strokeWidth={1.8} /></span>
        <h3 className="flashcard-deck__title">{deckName}</h3>
      </div>

      <div className="flashcard-deck__stats">
        <div className="flashcard-deck__stat">
          <span className="flashcard-deck__stat-val">{total}</span>
          <span className="ui-label">Cards</span>
        </div>
        <div className="flashcard-deck__stat">
          <span className={`flashcard-deck__stat-val${due > 0 ? ' flashcard-deck__stat-val--due' : ''}`}>{due}</span>
          <span className="ui-label">Due</span>
        </div>
        <span className="flashcard-deck__cta">Review <ArrowRight size={13} /></span>
      </div>
    </button>
  );
}
