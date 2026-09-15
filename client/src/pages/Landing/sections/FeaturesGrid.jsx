import React, { useState, useEffect } from 'react';
import ScrollReveal from '../components/ScrollReveal';
import FeatureCard from '../components/FeatureCard';
import MiniOrb from '../components/MiniOrb';
import { Brain, Mic, Target, Calendar, Sparkles, Notebook } from 'lucide-react';
import './FeaturesGrid.css';

const Typewriter = ({ text, delay = 100 }) => {
  const [currentText, setCurrentText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setCurrentText(text.substring(0, i));
      i++;
      if (i > text.length + 20) { i = 0; } // pause at end then loop
    }, delay);
    return () => clearInterval(interval);
  }, [text, delay]);

  return <span>{currentText}<span className="cursor-blink">|</span></span>;
};

export default function FeaturesGrid() {
  return (
    <section id="features" className="features-section">
      <div className="features-inner">
        <ScrollReveal className="section-header-centered">
          <h2 className="section-title">Everything you need.</h2>
          <p className="section-subtitle">A unified suite of tools designed to work together.</p>
        </ScrollReveal>

        <ScrollReveal className="features-grid">
          
          <FeatureCard 
            icon={Brain}
            title="Meet your intelligent life assistant."
            description="Your personal AI that plans, schedules, and adapts to your life. Give it a goal and it breaks it down."
            colSpan={2}
            accentColor="var(--green-500)"
            preview={
              <div className="mock-chat">
                <div className="mock-msg user">Build a marathon roadmap</div>
                <div className="mock-msg ai">
                  <Typewriter text="I've created a 12-week marathon training plan. Your first 5k run is scheduled for tomorrow at 6 AM." delay={40} />
                </div>
              </div>
            }
          />

          <FeatureCard 
            icon={Mic}
            title="Voice AI, built for you."
            description="Talk to Jarvis in natural Hinglish. Create tasks, get study notes, or ask about your day — hands-free."
            colSpan={2}
            accentColor="var(--coffee-500)"
            preview={
              <div className="mock-voice-preview">
                <MiniOrb size={80} color="var(--coffee-500)" />
                <div className="mock-voice-ribbon">
                  <Typewriter text='"Aaj mera schedule kya hai?"' delay={60} />
                </div>
              </div>
            }
          />

          <FeatureCard 
            icon={Target}
            title="Goal Tracking"
            description="Set audacious goals. Break them into milestones. Watch progress compound weekly."
            accentColor="var(--green-500)"
            preview={
              <div className="mock-progress-container">
                <div className="mock-progress-bar">
                  <div className="mock-progress-fill" style={{ width: '68%' }} />
                </div>
                <span className="mock-progress-text">68%</span>
              </div>
            }
          />

          <FeatureCard 
            icon={Calendar}
            title="Smart Calendar"
            description="AI-scheduled focus blocks that respect your energy and priorities."
            accentColor="var(--blue-500)"
            preview={
              <div className="mock-calendar-strip">
                {[1,2,3,4,5,6,7].map(d => (
                  <div key={d} className={`mock-cal-day ${d === 3 ? 'active' : ''}`}>
                    <div className="mock-cal-block" style={{ height: d % 2 === 0 ? '40px' : '20px' }} />
                  </div>
                ))}
              </div>
            }
          />

          <FeatureCard 
            icon={Sparkles}
            title="Deep Focus Mode"
            description="Pomodoro reimagined. Track streaks. Build the deep work habit that changes careers."
            accentColor="var(--purple-500)"
            preview={
              <div className="mock-focus-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="mock-ring-bg" />
                  <circle cx="50" cy="50" r="40" className="mock-ring-fill" />
                </svg>
                <span className="mock-focus-time">25:00</span>
              </div>
            }
          />

          <FeatureCard 
            icon={Notebook}
            title="Notes that think."
            description="Jarvis writes structured Hinglish notes on any topic — DBMS, system design, whatever's blocking you."
            accentColor="var(--amber-500)"
            preview={
              <div className="mock-note">
                <div className="mock-note-header">SystemDesign.md</div>
                <div className="mock-note-body">
                  <Typewriter text="# Consistent Hashing..." delay={80} />
                </div>
              </div>
            }
          />

        </ScrollReveal>
      </div>
    </section>
  );
}
