import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

export default function AnimatedCounter({ from = 0, to, duration = 2, delay = 0, suffix = '' }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString() + suffix);
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(to);
      return;
    }
    
    if (isInView) {
      const controls = animate(count, to, {
        duration: duration,
        delay: delay,
        ease: "easeOut"
      });
      return controls.stop;
    }
  }, [count, isInView, to, duration, delay, prefersReducedMotion]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
