import React from 'react';

export default function GradientText({ children, className = '' }) {
  return (
    <span 
      className={className} 
      style={{
        color: '#AB562F',
        display: 'inline-block'
      }}
    >
      {children}
    </span>
  );
}
