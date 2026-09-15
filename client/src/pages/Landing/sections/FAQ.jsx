import React, { useState } from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);
  
  const faqs = [
    {
      q: "Is my data private?",
      a: "Yes. We use industry-standard encryption for all your data. Your goals, tasks, and journal entries are strictly private and never used to train global AI models without your explicit consent."
    },
    {
      q: "Does the voice AI really understand Hinglish?",
      a: "Absolutely. Jarvis is specifically fine-tuned on Indian contexts and conversational patterns. You can mix Hindi and English exactly how you speak with your friends, and it will understand perfectly."
    },
    {
      q: "Can I use it without signing up?",
      a: "You need an account to save your progress, track streaks, and retain AI memory. However, signing up takes less than 30 seconds and the core features are completely free forever."
    },
    {
      q: "What if I already use Notion / Todoist?",
      a: "AI LifeOS isn't just a database, it's an active assistant. You can continue using Notion for static storage, but use AI LifeOS for your active daily planning, focus tracking, and voice-assisted journaling."
    },
    {
      q: "Is there a mobile app?",
      a: "Our web application is fully responsive and works beautifully on mobile browsers. A dedicated native app for iOS and Android is currently on our roadmap for later this year."
    },
    {
      q: "How does the AI know my context?",
      a: "Jarvis securely analyzes your recent tasks, active goals, and notes. When you ask 'what should I do next?', it factors in your upcoming deadlines and current focus streaks to give a highly personalized recommendation."
    }
  ];

  return (
    <section id="faq" className="faq-section">
      <div className="faq-inner">
        <ScrollReveal className="section-header-centered">
          <h2 className="section-title">Frequently asked.</h2>
        </ScrollReveal>

        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div 
                className={`faq-item ${openIdx === idx ? 'open' : ''}`}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              >
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <ChevronDown 
                    size={20} 
                    className={`faq-icon ${openIdx === idx ? 'rotated' : ''}`} 
                  />
                </div>
                <AnimatePresence>
                  {openIdx === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="faq-answer"
                    >
                      <p>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
