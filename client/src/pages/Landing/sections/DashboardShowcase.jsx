import React, { useState, useEffect } from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { motion, AnimatePresence } from 'framer-motion';
import './DashboardShowcase.css';

export default function DashboardShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const screens = [
    { name: 'Dashboard Main', color: 'var(--green-500)', icon: '🏠' },
    { name: 'Focus Mode', color: 'var(--purple-500)', icon: '⏱️' },
    { name: 'Study Notes', color: 'var(--amber-500)', icon: '📓' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [screens.length]);

  return (
    <section className="showcase-section">
      <ScrollReveal className="showcase-inner">
        <div className="section-header-centered">
          <h2 className="section-title">Everything in one beautiful workspace.</h2>
        </div>

        <div className="showcase-device">
          <div className="showcase-chrome">
            <div className="showcase-dots">
              <span/><span/><span/>
            </div>
          </div>
          
          <div className="showcase-screen-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="showcase-screen"
                style={{
                  background: `radial-gradient(circle at center, color-mix(in srgb, ${screens[currentIndex].color} 20%, transparent), var(--bg-app))`
                }}
              >
                <div className="showcase-mock-ui">
                  <span className="showcase-icon">{screens[currentIndex].icon}</span>
                  <h3>{screens[currentIndex].name} View</h3>
                  <p>Product preview loaded...</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="showcase-pagination">
          {screens.map((_, idx) => (
            <button 
              key={idx}
              className={`pagination-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View screen ${idx + 1}`}
            />
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
