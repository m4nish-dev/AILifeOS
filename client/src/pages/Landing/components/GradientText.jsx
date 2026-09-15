import React from 'react';

export default function GradientText({ children, className = '' }) {
  return (
    <span 
      className={className} 
      style={{
        background: 'linear-gradient(90deg, #17A46B, #7CB4FB, #A78BFA)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block'
      }}
    >
      {children}
    </span>
  );
}
