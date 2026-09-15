import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { Star } from 'lucide-react';
import './Testimonials.css';

export default function Testimonials() {
  const testimonials = [
    {
      quote: "Finally an app that gets Indian developers. Jarvis speaks like my hostel roommate but plans like a founder.",
      name: "Ananya S.",
      role: "CS Junior, IIT Delhi",
      initial: "A"
    },
    {
      quote: "Voice notes in Hinglish while walking to class = 10x my study efficiency. I literally dictated my entire OS notes on the way.",
      name: "Rahul M.",
      role: "NSUT",
      initial: "R"
    },
    {
      quote: "The focus streaks alone made me ship two side projects last month. Deep focus mode is a game changer for ADHD.",
      name: "Priya K.",
      role: "SDE-2, Bangalore",
      initial: "P"
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="testimonials-inner">
        <ScrollReveal className="section-header-centered">
          <h2 className="section-title">Built for people who ship.</h2>
        </ScrollReveal>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1} className="testimonial-card">
              <div className="testimonial-card-inner">
                <p className="t-quote">"{t.quote}"</p>
                <hr className="t-divider" />
                <div className="t-author">
                  <div className="t-avatar">{t.initial}</div>
                  <div className="t-info">
                    <h4>{t.name}</h4>
                    <span>{t.role}</span>
                  </div>
                </div>
                <div className="t-rating">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="var(--green-500)" color="var(--green-500)" />)}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
