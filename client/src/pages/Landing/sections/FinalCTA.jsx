import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './FinalCTA.css';

export default function FinalCTA() {
  return (
    <section id="final-cta" className="final-cta-section">
      <div className="cta-inner">
        <h2 className="cta-title">Ready to run your life like a founder runs a company?</h2>
        <p className="cta-subtitle">Free forever. Set up in 60 seconds. Your AI assistant is waiting.</p>
        <Link to="/signup" className="cta-btn">
          Start your journey — it's free <ArrowRight size={18} />
        </Link>
        <span className="cta-footnote">No credit card. No spam. Just clarity.</span>
      </div>
    </section>
  );
}
