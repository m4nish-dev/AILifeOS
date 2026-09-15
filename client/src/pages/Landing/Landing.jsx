import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Target, Calendar, Sparkles, ArrowRight, Brain } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const isLoggedIn = !!localStorage.getItem('ailifeos-token');

  return (
    <div className="landing-container">
      {/* Background Ambient Orbs */}
      <div className="landing-orb landing-orb--1" />
      <div className="landing-orb landing-orb--2" />
      <div className="landing-orb landing-orb--3" />

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="logo-icon">
            <Sparkles size={20} />
          </div>
          <span className="logo-text">AI LifeOS <span className="logo-pro">PRO</span></span>
        </div>
        <div className="landing-nav-actions">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-primary">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Sign in</Link>
              <Link to="/register" className="btn-primary">Get Started free</Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="landing-main">
        
        {/* Hero Section */}
        <section className="landing-hero">
          <h1 className="hero-title">
            Your personal <br />
            <span className="text-gradient">operating system</span> <br />
            for life.
          </h1>
          <p className="hero-subtitle">
            AI-powered productivity. Smart goals. Deep focus. Everything you need to build the life you want in one unified, beautiful workspace.
          </p>
          
          <div className="hero-cta">
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-primary btn-large">
                Go to Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <Link to="/register" className="btn-primary btn-large">
                Start your journey <ArrowRight size={20} />
              </Link>
            )}
            
            <div className="hero-social-proof">
              <div className="hero-avatars">
                {['M', 'A', 'S', 'R'].map((l, i) => (
                  <div key={i} className="hero-avatar" style={{ zIndex: 4 - i }}>{l}</div>
                ))}
              </div>
              <span>Join <strong>2,400+</strong> developers building their ideal life</span>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="landing-features">
          <div className="section-header">
            <h2>Everything you need.</h2>
            <p>A unified suite of tools designed to work together.</p>
          </div>

          <div className="bento-grid">
            {/* AI Assistant Showcase (Large Card) */}
            <div className="bento-card large">
              <div className="bento-text" style={{ maxWidth: '400px' }}>
                <div className="bento-icon green" style={{ marginBottom: '16px' }}>
                  <Brain size={28} strokeWidth={2.5} />
                </div>
                <h3>Meet your intelligent life assistant.</h3>
                <p>
                  Chat with an AI that intimately knows your goals, tasks, and schedule. 
                  Ask it to summarize your notes, generate a 4-week roadmap, or instantly create calendar events from your thoughts.
                </p>
                <div style={{ marginTop: '24px' }}>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                    <li>✨ Type <code>/task Make coffee</code> to instantly create a task</li>
                    <li>✨ Type <code>/event Meeting at 4pm</code> to schedule</li>
                    <li>✨ Type <code>/goal Run 5k</code> to start tracking</li>
                  </ul>
                </div>
              </div>
              <div className="bento-visual">
                <div className="visual-mockup">
                  <div className="mockup-message user">
                    Can you generate a 4-week roadmap for my marathon goal?
                  </div>
                  <div className="mockup-message ai">
                    Absolutely! I've analyzed your current fitness notes. Here is a customized 4-week training schedule designed specifically for your target pace...
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bento-card">
              <div className="bento-icon amber">
                <Target size={28} />
              </div>
              <div className="bento-text">
                <h3>Goal Tracking</h3>
                <p>Break massive life goals down into actionable milestones and let our progress tracking keep you motivated.</p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="bento-card">
              <div className="bento-icon blue">
                <Calendar size={28} />
              </div>
              <div className="bento-text">
                <h3>Smart Calendar</h3>
                <p>Your tasks, events, and deep work sessions unified into one powerful schedule. Drag, drop, and plan your week.</p>
              </div>
            </div>
            
            {/* Feature 4 */}
            <div className="bento-card">
              <div className="bento-icon purple">
                <Sparkles size={28} />
              </div>
              <div className="bento-text">
                <h3>Deep Focus Mode</h3>
                <p>Enter immersive focus sessions. Track your deep work analytics and train your brain to achieve flow state faster.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-logo">
          <div className="logo-icon" style={{ width: '24px', height: '24px' }}>
            <Sparkles size={14} />
          </div>
          <span className="logo-text" style={{ fontSize: '14px' }}>AI LifeOS <span className="logo-pro">PRO</span></span>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} AILifeOS. All rights reserved.
        </div>
        <div className="landing-nav-actions">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-secondary" style={{ fontSize: '13px' }}>Dashboard</Link>
          ) : (
            <Link to="/login" className="btn-secondary" style={{ fontSize: '13px' }}>Sign in to account</Link>
          )}
        </div>
      </footer>
    </div>
  );
}
