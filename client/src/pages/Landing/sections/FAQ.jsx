import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const FAQS = [
  { q: "Is my data private?", a: "Yes. All your data is encrypted. Your goals, tasks, and notes are strictly private and never used to train AI models without your consent." },
  { q: "Does the AI really understand Hinglish?", a: "Yes. Jarvis is tuned for Indian conversational patterns. Mix Hindi and English exactly like you talk with friends — it understands naturally." },
  { q: "Can I use it without an account?", a: "You need a free account to save progress and retain AI memory. Signing up takes under 30 seconds and is completely free." },
  { q: "What if I already use Notion / Todoist?", a: "AI LifeOS is an active AI assistant, not just a database. Use Notion for static storage, AI LifeOS for daily planning, focus tracking, and AI conversations." },
  { q: "Is there a mobile app?", a: "The web app is fully responsive on mobile. A native iOS and Android app is on our roadmap for later this year." },
  { q: "How does the AI know my context?", a: "Jarvis securely reads your active goals, recent tasks, and study notes to give highly personalised recommendations in every conversation." },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="faq-section">
      <div className="faq-inner">
        <div className="faq-header">
          <span className="faq-section-label">FAQ</span>
          <h2 className="faq-section-title">Frequently asked.</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item ${open === i ? 'open' : ''}`} onClick={() => setOpen(open === i ? null : i)}>
              <div className="faq-question">
                <h3>{f.q}</h3>
                <ChevronDown size={18} className={`faq-icon ${open === i ? 'rotated' : ''}`} />
              </div>
              {open === i && (
                <div className="faq-answer">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
