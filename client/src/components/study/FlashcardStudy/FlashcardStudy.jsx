import { useState } from 'react';
import { ArrowLeft, Check, X, RotateCw } from 'lucide-react';
import './FlashcardStudy.css';

export default function FlashcardStudy({ cards, onReview, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeCard = cards[currentIndex];
  const isDone = currentIndex >= cards.length;

  const handleReview = (correct) => {
    onReview(activeCard._id, correct);
    setIsFlipped(false);
    setCurrentIndex(i => i + 1);
  };

  if (isDone) {
    return (
      <div className="fc-study-done">
        <div className="fc-study-done__icon">🎉</div>
        <h2>You're all caught up!</h2>
        <p>You've reviewed all due cards in this deck.</p>
        <button className="fc-btn fc-btn--primary" onClick={onExit}>Back to Decks</button>
      </div>
    );
  }

  return (
    <div className="fc-study">
      <div className="fc-study__header">
        <button className="fc-study__back" onClick={onExit}>
          <ArrowLeft size={18} /> Exit
        </button>
        <div className="fc-study__progress">
          <div className="fc-study__progress-bar">
            <div 
              className="fc-study__progress-fill" 
              style={{ width: `${(currentIndex / cards.length) * 100}%` }} 
            />
          </div>
          <span>{currentIndex} / {cards.length}</span>
        </div>
      </div>

      <div className="fc-scene" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`fc-card ${isFlipped ? 'fc-card--flipped' : ''}`}>
          <div className="fc-card__face fc-card__face--front">
            <div className="fc-card__label">Question</div>
            <div className="fc-card__content">{activeCard.front}</div>
            <div className="fc-card__hint">
              <RotateCw size={14} /> Click to reveal answer
            </div>
          </div>
          
          <div className="fc-card__face fc-card__face--back">
            <div className="fc-card__label">Answer</div>
            <div className="fc-card__content">{activeCard.back}</div>
          </div>
        </div>
      </div>

      <div className="fc-study__controls">
        <button 
          className="fc-btn fc-btn--wrong" 
          disabled={!isFlipped}
          onClick={() => handleReview(false)}
        >
          <X size={18} /> Study More
        </button>
        
        <button 
          className="fc-btn fc-btn--correct" 
          disabled={!isFlipped}
          onClick={() => handleReview(true)}
        >
          <Check size={18} /> Got It
        </button>
      </div>
    </div>
  );
}
