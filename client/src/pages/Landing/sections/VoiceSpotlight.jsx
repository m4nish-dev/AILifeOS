import React, { useState, useEffect } from 'react';
import ScrollReveal from '../components/ScrollReveal';
import MiniOrb from '../components/MiniOrb';
import { CheckCircle2 } from 'lucide-react';
import './VoiceSpotlight.css';

export default function VoiceSpotlight() {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Schedule my run for tomorrow morning",
    "DBMS ke notes open karo",
    "Start a 25 min focus block",
    "What's my streak?"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="voice" className="voice-spotlight-section">
      <div className="voice-bg-gradient" />
      <div className="voice-inner">
        <ScrollReveal className="voice-content">
          <h2 className="section-title">Voice AI that actually speaks your language.</h2>
          <p className="section-subtitle">Natural Hinglish. Real-time interruption handling. Feels like a friend, not a robot.</p>
          
          <ul className="voice-features-list">
            <li>
              <CheckCircle2 color="var(--green-500)" size={20} />
              <span>Natural Hinglish — mixes Hindi and English like real conversation</span>
            </li>
            <li>
              <CheckCircle2 color="var(--green-500)" size={20} />
              <span>Interrupts gracefully — talk over Jarvis anytime</span>
            </li>
            <li>
              <CheckCircle2 color="var(--green-500)" size={20} />
              <span>Understands context — knows your goals, tasks, and streaks</span>
            </li>
            <li>
              <CheckCircle2 color="var(--green-500)" size={20} />
              <span>Executes actions — creates tasks, opens notes, starts focus</span>
            </li>
          </ul>

          <button className="btn-primary" onClick={() => document.getElementById('final-cta')?.scrollIntoView({behavior: 'smooth'})}>
            Try voice AI
          </button>
        </ScrollReveal>

        <ScrollReveal className="voice-visual" delay={0.2}>
          <div className="voice-visual-glow" />
          <MiniOrb size={120} color="var(--coffee-500)" />
          <div className="voice-transcript-box">
            <p key={msgIdx} className="fade-in-text">"{messages[msgIdx]}"</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
