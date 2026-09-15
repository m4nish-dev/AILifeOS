import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Sparkles, AlertTriangle, Eye, EyeOff, Github, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MiniOrb from '../Landing/components/MiniOrb';
import './AuthV2.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Something went wrong.');
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

  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(form.password);
  const strengthColor = strength === 0 ? '#E23B3B' : strength === 1 ? '#F5A524' : strength === 2 ? '#F5A524' : '#0E8C5A';

  return (
    <div className="auth-split">
      <div className="auth-form-side">
        <div className="auth-form-inner">
          <Link to="/" className="auth-logo">
            <Sparkles size={20} />
            <span>AI LifeOS <span className="pro-badge">PRO</span></span>
          </Link>

          <div className="auth-header">
            <h1>Start your journey</h1>
            <p>Create your account and take control of your life.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input type="text" placeholder="Manish Kumar" value={form.name} onChange={set('name')} />
            </div>

            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
            </div>

            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {form.password && (
              <div className="auth-strength-meter">
                <div className="strength-bars">
                  {[0,1,2].map(i => (
                    <div key={i} className="strength-bar" style={{ background: i < strength ? strengthColor : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <div className="strength-labels">
                  <span className={form.password.length >= 6 ? 'ok' : ''}><CheckCircle2 size={12}/> 6+ chars</span>
                  <span className={/[A-Z]/.test(form.password) ? 'ok' : ''}><CheckCircle2 size={12}/> Uppercase</span>
                  <span className={/\d/.test(form.password) ? 'ok' : ''}><CheckCircle2 size={12}/> Number</span>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-error">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create my account'}
            </button>
          </form>

          <div className="auth-divider"><span>Or continue with</span></div>
          
          <div className="auth-socials">
            <button className="btn-secondary"><Github size={18} /> GitHub</button>
          </div>

          <p className="auth-footer">
            Already have an account? <Link to="/signin">Sign in</Link>
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
