import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X } from 'lucide-react';
import './NavBar.css';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('ailifeos-token');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="landing-nav-inner">
        <Link to="/" className="landing-logo">
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          <span className="logo-text">AI LifeOS <span className="logo-pro">PRO</span></span>
        </Link>

        <div className="landing-nav-links desktop-only">
          <button onClick={() => scrollTo('features')}>Features</button>
          <button onClick={() => scrollTo('ai-assistant')}>AI Assistant</button>
          <button onClick={() => scrollTo('faq')}>FAQ</button>
        </div>

        <div className="landing-nav-actions desktop-only">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/signin" className="btn-secondary">Sign in</Link>
              <Link to="/signup" className="btn-primary">Get Started free</Link>
            </>
          )}
        </div>

        <button
          className="mobile-menu-btn mobile-only"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <button onClick={() => scrollTo('features')}>Features</button>
          <button onClick={() => scrollTo('ai-assistant')}>AI Assistant</button>
          <button onClick={() => scrollTo('faq')}>FAQ</button>
          <div className="mobile-menu-actions">
            {isLoggedIn ? (
              <Link to="/dashboard" className="btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/signin" className="btn-secondary">Sign in</Link>
                <Link to="/signup" className="btn-primary">Get Started free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
