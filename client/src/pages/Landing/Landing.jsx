import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Target, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const isLoggedIn = !!localStorage.getItem('ailifeos-token');

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="logo-icon">
            <Sparkles size={20} className="logo-sparkle" />
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
              <Link to="/login" className="btn-secondary">Log in</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Your personal <br />
            <span className="text-gradient">operating system</span> <br />
            for life.
          </h1>
          <p className="hero-subtitle">
            AI-powered productivity. Smart goals. Deep focus. Everything you need to build the life you want in one unified workspace.
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
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="hero-features">
          <div className="feature-card">
            <div className="feature-icon green">
              <Bot size={24} />
            </div>
            <div className="feature-text">
              <h3>AI-Powered Planning</h3>
              <p>Your own intelligent life assistant</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon amber">
              <Target size={24} />
            </div>
            <div className="feature-text">
              <h3>Goal Tracking</h3>
              <p>Track milestones and stay on course</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon blue">
              <Calendar size={24} />
            </div>
            <div className="feature-text">
              <h3>Smart Calendar</h3>
              <p>Tasks, events and focus in one view</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon purple">
              <Sparkles size={24} />
            </div>
            <div className="feature-text">
              <h3>Focus Mode</h3>
              <p>Deep work sessions with analytics</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
