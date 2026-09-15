import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Mic, ChevronDown } from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';
import GradientText from '../components/GradientText';
import ScrollReveal from '../components/ScrollReveal';
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
      <AmbientBackground />
      
      <ScrollReveal className="hero-content" staggerChildren={0.1}>
        {/* Pill Badge */}
        <a href="#voice" className="hero-badge">
          <Mic size={14} className="hero-badge-icon" />
          ✨ Now with voice AI in Hinglish
        </a>

        {/* Headlines */}
        <h1 className="hero-title">
          Your personal<br />
          <GradientText>operating system</GradientText><br />
          for life.
        </h1>
        
        <p className="hero-subtitle">
          AI-powered productivity. Smart goals. Deep focus. Everything you need to build the life you want in one unified workspace.
        </p>

        {/* CTAs */}
        <div className="hero-actions">
          <Link to="/signup" className="btn-primary hero-btn-main">
            Start your journey <ArrowRight size={20} />
          </Link>
          <button className="btn-ghost hero-btn-secondary">
            <Play size={20} fill="currentColor" /> Watch 90s demo
          </button>
        </div>

        {/* Social Proof */}
        <div className="hero-social-strip">
          <div className="hero-avatars">
            {['M', 'A', 'S', 'R'].map((l, i) => (
              <div key={i} className="hero-avatar" style={{ zIndex: 4 - i }}>{l}</div>
            ))}
          </div>
          <span className="hero-social-text">Join <strong>2,400+</strong> developers building their ideal life</span>
        </div>

        {/* Live Indicator */}
        <div className="hero-live-indicator">
          <div className="live-dot" />
          <span className="live-text" key={liveMessage}>{messages[liveMessage]}</span>
        </div>
      </ScrollReveal>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator">
        <ChevronDown size={24} className="bounce-anim" />
      </div>
    </section>
  );
}
