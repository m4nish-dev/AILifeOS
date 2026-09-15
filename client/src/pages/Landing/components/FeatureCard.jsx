import React from 'react';
import CursorGlow from './CursorGlow';
import './FeatureCard.css';

export default function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  preview,
  accentColor = 'var(--green-500)',
  colSpan = 1
}) {
  return (
    <div className={`feature-card ${colSpan === 2 ? 'col-span-2' : ''}`} style={{ '--card-accent': accentColor }}>
      <CursorGlow color={accentColor.replace(')', ', 0.15)').replace('var(--green-500)', 'rgba(22, 164, 107, 0.15)').replace('var(--coffee-500)', 'rgba(160, 113, 74, 0.15)')}>
        <div className="feature-card-inner">
          <div className="feature-card-content">
            <div className="feature-icon-wrapper" style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}>
              <Icon size={20} style={{ color: accentColor }} />
            </div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-desc">{description}</p>
          </div>
          {preview && (
            <div className="feature-card-preview">
              {preview}
            </div>
          )}
        </div>
      </CursorGlow>
    </div>
  );
}
