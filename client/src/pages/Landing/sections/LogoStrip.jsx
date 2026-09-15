import React from 'react';
import './LogoStrip.css';

const logos = ["NSUT", "IIT Delhi", "BITS Pilani", "Y Combinator", "Notion", "Linear", "NSUT", "IIT Delhi", "BITS Pilani", "Y Combinator", "Notion", "Linear"];

export default function LogoStrip() {
  return (
    <section className="logo-strip-section">
      <p className="logo-strip-label">Trusted by students and developers from</p>
      <div className="marquee-container">
        <div className="marquee-track">
          <div className="marquee-content">
            {logos.map((logo, idx) => (
              <span key={idx} className="logo-item">{logo}</span>
            ))}
          </div>
          <div className="marquee-content" aria-hidden="true">
            {logos.map((logo, idx) => (
              <span key={`dup-${idx}`} className="logo-item">{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
