import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';
import './Stats.css';

export default function Stats() {
  const stats = [
    { value: 2400, suffix: '+', label: 'Active Users' },
    { value: 180, suffix: 'K+', label: 'Tasks Completed' },
    { value: 94, suffix: '%', label: 'Retention after 30 days' },
    { value: 'Hinglish', isString: true, label: 'First-class Supported' }
  ];

  return (
    <section className="stats-section">
      <div className="stats-inner">
        {stats.map((stat, idx) => (
          <ScrollReveal key={idx} delay={idx * 0.1} className="stat-card">
            <h3 className="stat-value">
              {stat.isString ? stat.value : <AnimatedCounter to={stat.value} suffix={stat.suffix} />}
            </h3>
            <p className="stat-label">{stat.label}</p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
