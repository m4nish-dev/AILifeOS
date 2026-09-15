import React from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import './MiniOrb.css';

export default function MiniOrb({ size = 80, color = 'var(--coffee-500)', iconColor = '#fff' }) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="mini-orb-container" style={{ width: size, height: size }}>
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="mini-orb-ring"
            style={{ borderColor: color }}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              ease: "easeOut",
              repeat: Infinity,
            }}
          />
          <motion.div
            className="mini-orb-ring"
            style={{ borderColor: color }}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              ease: "easeOut",
              repeat: Infinity,
              delay: 1,
            }}
          />
        </>
      )}
      
      <div 
        className="mini-orb-core"
        style={{ 
          background: `radial-gradient(circle at 30% 30%, ${color}, #0B0D10)`,
          boxShadow: `0 0 20px ${color}`
        }}
      >
        <Mic size={size * 0.4} color={iconColor} />
      </div>
    </div>
  );
}
