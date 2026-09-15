import React from 'react';
import MarqueeRow from '../components/MarqueeRow';
import './LogoStrip.css';

export default function LogoStrip() {
  const logos = [
    "NSUT", "IIT Delhi", "BITS", "Y Combinator alumni", "Notion", "Linear", 
    "NSUT", "IIT Delhi", "BITS", "Y Combinator alumni", "Notion", "Linear"
  ];

  return (
    <section className="logo-strip-section">
      <div className="logo-strip-inner">
        <p className="logo-strip-label">Trusted by students and developers from</p>
        <MarqueeRow speed={50}>
          {logos.map((logo, idx) => (
            <div key={idx} className="logo-item">
              {logo}
            </div>
          ))}
        </MarqueeRow>
      </div>
    </section>
  );
}
