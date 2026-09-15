import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import './Hero.css';

export default function Hero() {
  const [liveMessage, setLiveMessage] = useState(0);
  const messages = [
    "3 people signed up in the last hour",
    "Ananya just completed a focus block",
    "Rahul scheduled his 4-week roadmap"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMessage((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-content">
        {/* Badge — no voice icon */}
        <div className="hero-badge">
          ✨ AI Chat Assistant in Hinglish
        </div>

        <h1 className="hero-title">
          Your personal <br />
          <span className="hero-gradient-word">operating system</span>
          <br />for life.
        </h1>

        <p className="hero-subtitle">
          AI-powered productivity. Smart goals. Deep focus. Everything you need to build the life you want in one unified workspace.
        </p>

        <div className="hero-actions">
          <Link to="/signup" className="btn-primary hero-btn-main">
            Start your journey <ArrowRight size={18} />
          </Link>
          <button className="btn-ghost">
            <Play size={16} fill="currentColor" /> Watch 90s demo
          </button>
        </div>

        <div className="hero-social-strip">
          <div className="hero-avatars">
            {['M', 'A', 'S', 'R'].map((l, i) => (
              <div key={i} className="hero-avatar" style={{ zIndex: 4 - i }}>{l}</div>
            ))}
          </div>
          <span className="hero-social-text">Join <strong>2,400+</strong> developers building their ideal life</span>
        </div>

        <div className="hero-live-indicator">
          <div className="live-dot" />
          <span className="live-text" key={liveMessage}>{messages[liveMessage]}</span>
        </div>
      </div>
    </section>
  );
}
