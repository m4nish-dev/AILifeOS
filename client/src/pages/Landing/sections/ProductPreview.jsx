import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { motion, useScroll, useTransform } from 'framer-motion';
import './ProductPreview.css';

export default function ProductPreview() {
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Simple parallax for callouts
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <section className="preview-section">
      <ScrollReveal className="preview-inner">
        <div className="preview-glow" />
        
        <div className="preview-frame">
          <div className="browser-chrome">
            <div className="traffic-lights">
              <span className="close" />
              <span className="minimize" />
              <span className="maximize" />
            </div>
            <div className="url-bar">app.ailifeos.com</div>
          </div>
          <div className="preview-content">
            <div className="preview-placeholder">
              <span className="placeholder-text">Dashboard Preview</span>
            </div>
          </div>
        </div>

        {/* Floating Callouts */}
        {!prefersReducedMotion ? (
          <>
            <motion.div style={{ y: y1 }} className="preview-callout top-left">
              <div className="callout-dot" />
              <span>AI-generated study plans</span>
            </motion.div>
            <motion.div style={{ y: y2 }} className="preview-callout top-right">
              <div className="callout-dot" />
              <span>Voice-controlled tasks</span>
            </motion.div>
            <motion.div style={{ y: y3 }} className="preview-callout bottom-left">
              <div className="callout-dot" />
              <span>Live focus tracking</span>
            </motion.div>
          </>
        ) : (
          <>
            <div className="preview-callout top-left">
              <div className="callout-dot" />
              <span>AI-generated study plans</span>
            </div>
            <div className="preview-callout top-right">
              <div className="callout-dot" />
              <span>Voice-controlled tasks</span>
            </div>
            <div className="preview-callout bottom-left">
              <div className="callout-dot" />
              <span>Live focus tracking</span>
            </div>
          </>
        )}
      </ScrollReveal>
    </section>
  );
}
