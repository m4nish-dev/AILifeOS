import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, CheckCircle2, Brain, Target, Calendar, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

const API = 'http://localhost:5001/api'

const FEATURES = [
  { icon: Brain, label: 'AI-Powered Planning', desc: 'Your own intelligent life assistant' },
  { icon: Target, label: 'Goal Tracking', desc: 'Track milestones and stay on course' },
  { icon: Calendar, label: 'Smart Calendar', desc: 'Tasks, events and focus in one view' },
  { icon: Zap, label: 'Focus Mode', desc: 'Deep work sessions with analytics' },
]

export default function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const isLogin = mode === 'login'

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isLogin && !form.name.trim()) return setError('Name is required.')
    if (!form.email.trim()) return setError('Email is required.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const body = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.message || 'Something went wrong.')
      } else {
        login(data.data.user, data.data.token)
        navigate('/dashboard')
      }
    } catch {
      setError('Cannot connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      {/* Left panel — brand / features */}
      <div className="auth__left">
        <div className="auth__left-inner">
          {/* Logo */}
          <div className="auth__logo">
            <div className="auth__logo-icon">
              <Sparkles size={22} strokeWidth={2} />
            </div>
            <span className="auth__logo-name">AI LifeOS</span>
            <span className="auth__logo-badge">PRO</span>
          </div>

          {/* Hero text */}
          <div className="auth__hero">
            <h1 className="auth__hero-title">
              Your personal<br />
              <span className="auth__hero-gradient">operating system</span><br />
              for life.
            </h1>
            <p className="auth__hero-sub">
              AI-powered productivity. Smart goals. Deep focus. Everything you need to build the life you want.
            </p>
          </div>

          {/* Feature pills */}
          <div className="auth__features">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="auth__feature">
                <div className="auth__feature-icon">
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="auth__feature-label">{label}</div>
                  <div className="auth__feature-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="auth__social-proof">
            <div className="auth__avatars">
              {['M', 'A', 'S', 'R'].map((l, i) => (
                <div key={i} className="auth__avatar" style={{ zIndex: 4 - i }}>{l}</div>
              ))}
            </div>
            <span>Join <strong>2,400+</strong> developers building their ideal life</span>
          </div>
        </div>

        {/* Background orbs */}
        <div className="auth__orb auth__orb--1" />
        <div className="auth__orb auth__orb--2" />
        <div className="auth__orb auth__orb--3" />
      </div>

      {/* Right panel — form */}
      <div className="auth__right">
        <div className="auth__form-wrap">
          {/* Header */}
          <div className="auth__form-head">
            <h2 className="auth__form-title">
              {isLogin ? 'Welcome back 👋' : 'Start your journey 🚀'}
            </h2>
            <p className="auth__form-sub">
              {isLogin
                ? 'Sign in to continue to your AILifeOS dashboard.'
                : 'Create your account and take control of your life today.'}
            </p>
          </div>

          {/* Form */}
          <form className="auth__form" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <div className="auth__field">
                <label className="auth__label">Full Name</label>
                <div className="auth__input-wrap">
                  <User size={15} className="auth__input-icon" />
                  <input
                    className="auth__input"
                    type="text"
                    placeholder="Manish Kumar"
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth__field">
              <label className="auth__label">Email Address</label>
              <div className="auth__input-wrap">
                <Mail size={15} className="auth__input-icon" />
                <input
                  className="auth__input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth__field">
              <div className="auth__label-row">
                <label className="auth__label">Password</label>
                {isLogin && (
                  <a className="auth__forgot" href="#">Forgot password?</a>
                )}
              </div>
              <div className="auth__input-wrap">
                <Lock size={15} className="auth__input-icon" />
                <input
                  className="auth__input"
                  type={showPw ? 'text' : 'password'}
                  placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth__pw-toggle"
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Password strength (register only) */}
            {!isLogin && form.password && (
              <PasswordStrength password={form.password} />
            )}

            {/* Error */}
            {error && (
              <div className="auth__error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth__submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth__submit-loading">
                  <span className="auth__spinner" />
                  {isLogin ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                isLogin ? 'Sign in to AILifeOS' : 'Create my account'
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="auth__switch">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} className="auth__switch-link">
              {isLogin ? 'Create one free' : 'Sign in'}
            </Link>
          </p>

          <p className="auth__terms">
            By continuing, you agree to our{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

function PasswordStrength({ password }) {
  const checks = [
    { label: '6+ characters', ok: password.length >= 6 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length

  const color = score === 0 ? '#E23B3B' : score === 1 ? '#F5A524' : score === 2 ? '#F5A524' : '#0E8C5A'
  const label = ['', 'Weak', 'Fair', 'Strong'][score]

  return (
    <div className="auth__strength">
      <div className="auth__strength-bars">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="auth__strength-bar"
            style={{ background: i < score ? color : 'var(--border-default)' }}
          />
        ))}
      </div>
      <span className="auth__strength-label" style={{ color }}>{label}</span>
      <div className="auth__strength-checks">
        {checks.map(c => (
          <span key={c.label} className={`auth__strength-check ${c.ok ? 'ok' : ''}`}>
            <CheckCircle2 size={11} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
