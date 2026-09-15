import React, { useRef, useState, useEffect } from 'react';
import './CursorGlow.css';

export default function CursorGlow({ children, className = '', color = 'rgba(255,255,255,0.06)' }) {
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseenter', () => setIsHovered(true));
      card.addEventListener('mouseleave', () => setIsHovered(false));
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseenter', () => setIsHovered(true));
        card.removeEventListener('mouseleave', () => setIsHovered(false));
      }
    };
  }, []);

  return (
    <div ref={cardRef} className={`cursor-glow-wrapper ${className}`}>
      <div 
        className="cursor-glow-overlay" 
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${color}, transparent 40%)`
        }} 
      />
      <div className="cursor-glow-content">
        {children}
      </div>
    </div>
  );
}
