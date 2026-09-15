import React from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';
import { Check } from 'lucide-react';
import './Pricing.css';

export default function Pricing() {
  const freeFeatures = [
    "Full dashboard access",
    "30 min voice AI / day",
    "Unlimited tasks & goals",
    "Basic AI notes"
  ];
  
  const proFeatures = [
    "Everything in Free",
    "Unlimited voice AI",
    "Advanced study notes generation",
    "Priority AI response",
    "Custom voice selection",
    "Export & integrations"
  ];

  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-inner">
        <ScrollReveal className="section-header-centered">
          <h2 className="section-title">Simple pricing. No surprises.</h2>
        </ScrollReveal>

        <div className="pricing-cards">
          <ScrollReveal className="pricing-card">
            <h3>Free forever</h3>
            <div className="price">₹0</div>
            <ul className="pricing-features">
              {freeFeatures.map((f, i) => (
                <li key={i}><Check size={18} color="var(--text-secondary)" /> {f}</li>
              ))}
            </ul>
            <Link to="/signup" className="btn-secondary full-width">Start free</Link>
          </ScrollReveal>

          <ScrollReveal className="pricing-card pro" delay={0.1}>
            <div className="popular-badge">Most popular</div>
            <h3>Pro</h3>
            <div className="price">₹299<span>/month</span></div>
            <ul className="pricing-features">
              {proFeatures.map((f, i) => (
                <li key={i}><Check size={18} color="var(--green-500)" /> {f}</li>
              ))}
            </ul>
            <Link to="/signup" className="btn-primary full-width">Go Pro</Link>
          </ScrollReveal>
        </div>
        
        <p className="pricing-footnote">Cancel anytime. No card required to start.</p>
      </div>
    </section>
  );
}
