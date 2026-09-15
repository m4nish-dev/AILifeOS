import React from 'react';
import './MarqueeRow.css';

export default function MarqueeRow({ children, speed = 40, pauseOnHover = true }) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`marquee-container ${pauseOnHover ? 'pause-on-hover' : ''}`}>
      <div 
        className="marquee-track"
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: prefersReducedMotion ? 'paused' : 'running'
        }}
      >
        <div className="marquee-content">{children}</div>
        <div className="marquee-content" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
