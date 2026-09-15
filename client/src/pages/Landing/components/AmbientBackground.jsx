import React from 'react';
import { motion } from 'framer-motion';
import './AmbientBackground.css';

export default function AmbientBackground() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div className="ambient-background-container">
        <div className="ambient-orb ambient-orb--green-static" />
        <div className="ambient-orb ambient-orb--coffee-static" />
      </div>
    );
  }

  return (
    <div className="ambient-background-container">
      <motion.div 
        className="ambient-orb ambient-orb--green"
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -50, 40, 0],
        }}
        transition={{
          duration: 20,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
      <motion.div 
        className="ambient-orb ambient-orb--coffee"
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 60, -30, 0],
        }}
        transition={{
          duration: 25,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </div>
  );
}
