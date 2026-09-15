import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, Brain, Zap, BookOpen } from 'lucide-react';
import './AIAssistantSpotlight.css';

const DEMO_MESSAGES = [
  { user: "Kal ke liye mera schedule banao", ai: "Done! I've blocked 9–11 AM for deep work on your project, 2 PM gym session, and evening study slot. 📅" },
  { user: "DBMS ke notes summarise karo", ai: "Sure! Key concepts: Normalization, ACID properties, Indexing. I've added them to your study notes. 📓" },
  { user: "What's my focus streak?", ai: "You're on a 7-day streak! 🔥 Today's goal: 3 Pomodoros. You've done 1 so far. Keep going!" },
];

export default function AIAssistantSpotlight() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    let timeout;
    const aiText = DEMO_MESSAGES[msgIdx].ai;
    setTyped('');
    setShowAi(false);

    // Type the AI response
    let i = 0;
    timeout = setTimeout(() => {
      setShowAi(true);
      const id = setInterval(() => {
        i++;
        setTyped(aiText.slice(0, i));
        if (i >= aiText.length) {
          clearInterval(id);
          // Move to next after 2.5s pause
          setTimeout(() => setMsgIdx(prev => (prev + 1) % DEMO_MESSAGES.length), 2500);
        }
      }, 30);
    }, 800);

    return () => clearTimeout(timeout);
  }, [msgIdx]);

  return (
    <section id="ai-assistant" className="ais-section">
      <div className="ais-inner">
        {/* Left — copy */}
        <div className="ais-copy">
          <span className="ais-label">AI Chat Assistant</span>
          <h2 className="ais-title">Talks your language.<br />Gets your context.</h2>
          <p className="ais-desc">
            Jarvis understands natural Hinglish, knows your goals, and can schedule, plan, and summarise — all in one conversation.
          </p>
          <ul className="ais-features">
            <li><CheckCircle2 size={16} color="#16A46B" /><span>Natural Hinglish — mix Hindi and English freely</span></li>
            <li><Brain size={16} color="#16A46B" /><span>Knows your goals, tasks, and study schedule</span></li>
            <li><Zap size={16} color="#16A46B" /><span>Executes actions — creates tasks, starts focus blocks</span></li>
            <li><BookOpen size={16} color="#16A46B" /><span>Generates structured study notes on demand</span></li>
          </ul>
          <a href="/signup" className="ais-cta">
            Try AI Chat Assistant
          </a>
        </div>

        {/* Right — animated chat demo */}
        <div className="ais-chat-demo">
          <div className="ais-chat-chrome">
            <div className="ais-chrome-dot" style={{ background: '#FF5F56' }} />
            <div className="ais-chrome-dot" style={{ background: '#FFBD2E' }} />
            <div className="ais-chrome-dot" style={{ background: '#27C93F' }} />
            <span className="ais-chrome-title">Jarvis — AI LifeOS</span>
          </div>

          <div className="ais-chat-body">
            <div className="ais-chat-header">
              <div className="ais-ai-avatar"><MessageSquare size={16} /></div>
              <div>
                <p className="ais-ai-name">Jarvis</p>
                <p className="ais-ai-status"><span className="ais-online-dot" />Online</p>
              </div>
            </div>

            <div className="ais-messages">
              <div className="ais-msg ais-msg-user" key={`user-${msgIdx}`}>
                {DEMO_MESSAGES[msgIdx].user}
              </div>
              {showAi && (
                <div className="ais-msg ais-msg-ai" key={`ai-${msgIdx}`}>
                  {typed}<span className="ais-cursor">|</span>
                </div>
              )}
            </div>

            <div className="ais-chat-input">
              <span>Ask Jarvis anything...</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
