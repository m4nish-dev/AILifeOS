import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Mic, Brain, Rocket } from 'lucide-react';
import './HowItWorks.css';

export default function HowItWorks() {
  const { scrollYProgress } = useScroll();
  const lineHeight = useTransform(scrollYProgress, [0.3, 0.6], ['0%', '100%']);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const steps = [
    {
      num: '01',
      title: 'Tell Jarvis what you want.',
      desc: 'Speak or type your goals, tasks, or questions in natural Hinglish.',
      icon: Mic
    },
    {
      num: '02',
      title: 'Watch it plan itself.',
      desc: 'AI breaks big goals into daily actions and schedules focus time for you.',
      icon: Brain
    },
    {
      num: '03',
      title: 'Show up. Ship progress.',
      desc: 'Build streaks, hit milestones, and let Jarvis keep you honest.',
      icon: Rocket
    }
  ];

  return (
    <section id="how-it-works" className="hiw-section">
      <div className="hiw-inner">
        <ScrollReveal className="section-header-centered">
          <h2 className="section-title">From idea to done in 3 steps.</h2>
        </ScrollReveal>

        <div className="hiw-steps-container">
          {/* Animated connection line */}
          <div className="hiw-line-bg" />
          {!prefersReducedMotion ? (
            <motion.div className="hiw-line-fill" style={{ height: lineHeight }} />
          ) : (
            <div className="hiw-line-fill" style={{ height: '100%' }} />
          )}

          {steps.map((step, idx) => (
            <ScrollReveal key={idx} className="hiw-step" delay={idx * 0.2}>
              <div className="hiw-step-marker">
                <span className="hiw-step-num">{step.num}</span>
              </div>
              <div className="hiw-step-card">
                <div className="hiw-step-icon">
                  <step.icon size={24} color="var(--green-500)" />
                </div>
                <div className="hiw-step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
