import React, { useState, useEffect } from 'react';
import './FeaturesGrid.css';

/* Tiny typewriter for card previews */
function TypewriterText({ text, delay = 45 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    let i = 0;
    setShown('');
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setTimeout(() => setShown(''), 2000);
      }
    }, delay);
    return () => clearInterval(id);
  }, [text, delay]);
  return <span>{shown}<span className="fg-cursor">|</span></span>;
}

const FEATURES = [
  {
    icon: '🤖',
    accent: '#16A46B',
    accentDim: 'rgba(22,164,107,0.1)',
    title: 'AI Chat Assistant',
    desc: 'Your personal AI that plans, schedules, and adapts to your life in real Hinglish.',
    span: 2,
    preview: (
      <div className="fg-chat-preview">
        <div className="fg-chat-msg fg-chat-user">Build a marathon roadmap in 12 weeks</div>
        <div className="fg-chat-msg fg-chat-ai">
          <TypewriterText text="Done! I've created a 12-week plan. Your first 5K run is tomorrow at 6 AM. Shall I block focus time daily?" />
        </div>
      </div>
    ),
  },
  {
    icon: '🎯',
    accent: '#16A46B',
    accentDim: 'rgba(22,164,107,0.1)',
    title: 'Goal Tracking',
    desc: 'Set audacious goals. Break them into milestones. Watch progress compound weekly.',
    preview: (
      <div className="fg-progress-wrap">
        <div className="fg-progress-bar">
          <div className="fg-progress-fill" style={{ width: '68%', background: '#16A46B' }} />
        </div>
        <span className="fg-progress-label" style={{ color: '#16A46B' }}>68%</span>
      </div>
    ),
  },
  {
    icon: '📅',
    accent: '#3B82F6',
    accentDim: 'rgba(59,130,246,0.1)',
    title: 'Smart Calendar',
    desc: 'AI-scheduled focus blocks that respect your energy levels and top priorities.',
    preview: (
      <div className="fg-cal-strip">
        {[20,60,30,80,40,70,50].map((h, i) => (
          <div key={i} className={`fg-cal-bar ${i === 3 ? 'active' : ''}`} style={{ height: h * 0.8 + 'px', background: i === 3 ? '#3B82F6' : 'rgba(59,130,246,0.2)' }} />
        ))}
      </div>
    ),
  },
  {
    icon: '⏱️',
    accent: '#8B5CF6',
    accentDim: 'rgba(139,92,246,0.1)',
    title: 'Deep Focus Mode',
    desc: 'Pomodoro reimagined. Track streaks. Build the deep work habit that changes careers.',
    preview: (
      <div className="fg-focus-ring-wrap">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="5" />
          <circle cx="36" cy="36" r="28" fill="none" stroke="#8B5CF6" strokeWidth="5"
            strokeDasharray="176" strokeDashoffset="44" strokeLinecap="round"
            transform="rotate(-90 36 36)" />
        </svg>
        <span className="fg-focus-label">25:00</span>
      </div>
    ),
  },
  {
    icon: '📓',
    accent: '#F5A524',
    accentDim: 'rgba(245,165,36,0.1)',
    title: 'Smart Notes',
    desc: 'Jarvis writes structured Hinglish notes on any topic — DBMS, system design, whatever's blocking you.',
    preview: (
      <div className="fg-note-preview">
        <div className="fg-note-top">SystemDesign.md</div>
        <div className="fg-note-body" style={{ color: '#F5A524' }}>
          <TypewriterText text="# Consistent Hashing — Notes for FAANG prep..." delay={70} />
        </div>
      </div>
    ),
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="fg-section">
      <div className="fg-inner">
        <div className="fg-header centered">
          <span className="fg-label">Features</span>
          <h2 className="fg-title">Everything you need.</h2>
          <p className="fg-sub">A unified suite of AI tools that actually work together.</p>
        </div>

        <div className="fg-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className={`fg-card ${f.span === 2 ? 'fg-span2' : ''}`}
              style={{ '--card-accent': f.accent, '--card-dim': f.accentDim }}>
              <div className="fg-card-icon-chip" style={{ background: f.accentDim }}>
                <span>{f.icon}</span>
              </div>
              <h3 className="fg-card-title">{f.title}</h3>
              <p className="fg-card-desc">{f.desc}</p>
              {f.preview && <div className="fg-card-preview">{f.preview}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
