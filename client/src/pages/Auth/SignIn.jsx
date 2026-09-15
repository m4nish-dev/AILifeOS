import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, AlertTriangle, Eye, EyeOff, Github } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MiniOrb from '../Landing/components/MiniOrb';
import './AuthV2.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);

  const quotes = [
    '"Finally an app that gets Indian developers."',
    '"Voice notes in Hinglish = 10x study efficiency."',
    '"The focus streaks made me ship two side projects."'
  ];

  useEffect(() => {
    const timer = setInterval(() => setQuoteIdx(prev => (prev + 1) % quotes.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim()) return setError('Email is required.');
    if (!form.password) return setError('Password is required.');

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Invalid credentials.');
      } else {
        login(data.data.user, data.data.token);
        navigate('/dashboard');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-form-side">
        <div className="auth-form-inner">
          <Link to="/" className="auth-logo">
            <Sparkles size={20} />
            <span>AI LifeOS <span className="pro-badge">PRO</span></span>
          </Link>

          <div className="auth-header">
            <h1>Welcome back</h1>
            <p>Sign in to your AI LifeOS workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
            </div>

            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="auth-error">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to workspace'}
            </button>
          </form>

          <div className="auth-divider"><span>Or continue with</span></div>
          
          <div className="auth-socials">
            <button className="btn-secondary"><Github size={18} /> GitHub</button>
          </div>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>

      <div className="auth-visual-side">
        <div className="visual-gradient-bg" />
        <div className="visual-content">
          <div className="visual-quote-box">
            <p key={quoteIdx} className="visual-quote">{quotes[quoteIdx]}</p>
          </div>
          <div className="visual-orb-wrapper">
            <MiniOrb size={80} color="rgba(255,255,255,0.2)" />
          </div>
          <div className="visual-trusted">
            Trusted by 2,400+ developers
          </div>
        </div>
      </div>
    </div>
  );
}
