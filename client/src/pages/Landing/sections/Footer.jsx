import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-inner">
        <div className="footer-columns">
          <div>
            <Link to="/" className="footer-logo">
              <Sparkles size={18} />
              <span>AI LifeOS</span>
            </Link>
            <p className="footer-tagline">Made in India 🇮🇳 with chai and no sleep.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#ai-assistant">AI Assistant</a>
            <a href="#faq">FAQ</a>
            <a href="#">Roadmap</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="#">Docs</a>
            <a href="#">Support</a>
            <a href="#">Community</a>
            <a href="#">Changelog</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 AI LifeOS. All rights reserved.</p>
          <div className="footer-social">
            <a href="#" aria-label="Twitter"><Twitter size={16} /></a>
            <a href="#" aria-label="GitHub"><Github size={16} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={16} /></a>
          </div>
          <div className="footer-legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
