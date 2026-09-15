import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import './FinalCTA.css';

export default function FinalCTA() {
  return (
    <section id="final-cta" className="final-cta-section">
      <div className="cta-bg-pattern" />
      <div className="cta-bg-glow" />
      
      <ScrollReveal className="cta-inner">
        <h2 className="cta-title">Ready to run your life like a founder runs a company?</h2>
        <p className="cta-subtitle">Free forever. Set up in 60 seconds. Your Jarvis is waiting.</p>
        
        <Link to="/signup" className="btn-primary cta-btn">
          Start your journey — it's free <ArrowRight size={20} />
        </Link>
        
        <p className="cta-footnote">No credit card. No spam. Just clarity.</p>
      </ScrollReveal>
    </section>
  );
}
