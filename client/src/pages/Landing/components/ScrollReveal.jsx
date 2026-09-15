import React from 'react';
import { motion } from 'framer-motion';

export default function ScrollReveal({ 
  children, 
  className = '', 
  delay = 0, 
  yOffset = 40,
  staggerChildren = 0
}) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0, y: yOffset },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1], // Custom spring-like easing
        delay: delay,
        when: "beforeChildren",
        staggerChildren: staggerChildren
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {children}
    </motion.div>
  );
}
