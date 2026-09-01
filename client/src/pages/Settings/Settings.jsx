import { useState } from 'react'
import { User, Palette, Bell, Shield, CreditCard, Sun, Moon, Monitor, Check, Camera, Loader2, Download } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'
import './Settings.css'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'theme', label: 'Appearance', icon: Palette },
  { id: 'preferences', label: 'Preferences', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account & Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function Settings() {
  const [active, setActive] = useState('profile')
  const { theme, setTheme } = useTheme()
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()

  if (!user) return null

  return (
    <div className="set-page">
      <div className="set-head">
        <h1>Settings</h1>
        <p>Manage your account, preferences, and how AI LifeOS works for you.</p>
      </div>

      <div className="set-grid">
        <nav className="set-nav">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`set-nav__item${active === id ? ' set-nav__item--active' : ''}`}
              onClick={() => setActive(id)}
            >
              <Icon size={14} strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="set-panel">
          {active === 'profile' && <ProfileSection user={user} updateUser={updateUser} showToast={showToast} />}
          {active === 'theme' && <ThemeSection theme={theme} setTheme={setTheme} user={user} updateUser={updateUser} showToast={showToast} />}
          {active === 'preferences' && <PreferencesSection user={user} updateUser={updateUser} showToast={showToast} />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'account' && <AccountSection showToast={showToast} />}
          {active === 'billing' && <BillingSection />}
        </div>
      </div>
    </div>
  )
}

function Section({ title, sub, children }) {
  return (
    <div className="set-section">
      <div className="set-section__head">
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <div className="set-section__body">{children}</div>
    </div>
  )
}

function ProfileSection({ user, updateUser, showToast }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, avatar: user.avatar || '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', form)
      if (res.data.success) {
        updateUser(res.data.data)
        showToast('Profile updated successfully', 'success')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section title="Profile" sub="This is how others see you on the platform.">
      <div className="set-avatar" style={{ gap: 24 }}>
        {form.avatar ? (
          <img src={form.avatar} alt="Avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="set-avatar__img" style={{ fontSize: 24 }}>{user.name.charAt(0).toUpperCase()}</div>
        )}
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Avatar URL</label>
          <input 
            type="text" 
            value={form.avatar} 
            onChange={(e) => setForm({ ...form, avatar: e.target.value })} 
            placeholder="https://example.com/avatar.jpg"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-200)', color: 'inherit' }}
          />
        </div>
      </div>

      <div className="set-row">
        <div className="set-field">
          <label>Full Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
      </div>
      <div className="set-field">
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>

      <div className="set-actions">
        <button className="set-btn set-btn--primary" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 size={13} className="an-spin" /> : <Check size={13} strokeWidth={2.5} />} Save changes
        </button>
      </div>
    </Section>
  )
}

function ThemeSection({ theme, setTheme, user, updateUser, showToast }) {
  const options = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { id: 'system', label: 'System', icon: Monitor, desc: 'Match your device' },
  ]

  const accentColors = ['green', 'coffee', 'blue', 'purple', 'red']
  const currentAccent = user.preferences?.accentColor || 'green'

  const updateAccent = async (color) => {
    try {
      const res = await api.put('/auth/profile', { preferences: { ...user.preferences, accentColor: color } })
      if (res.data.success) updateUser(res.data.data)
    } catch (err) {
      showToast('Failed to update accent color', 'error')
    }
  }

  return (
    <Section title="Appearance" sub="Customize how AI LifeOS looks on your device.">
      <div className="set-themes">
        {options.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            className={`set-theme${theme === id ? ' set-theme--active' : ''}`}
            onClick={() => setTheme(id === 'system' ? 'light' : id)}
          >
            <div className={`set-theme__preview set-theme__preview--${id}`}>
              <div></div><div></div>
            </div>
            <div className="set-theme__row">
              <Icon size={14} />
              <span>{label}</span>
              {theme === id && <Check size={13} className="set-theme__check" strokeWidth={2.5} />}
            </div>
            <p>{desc}</p>
          </button>
        ))}
      </div>

      <div className="set-field">
        <label>Accent Color (Coming Soon globally)</label>
        <div className="set-colors">
          {accentColors.map((c) => (
            <button 
              key={c} 
              className={`set-color set-color--${c}${currentAccent === c ? ' set-color--active' : ''}`} 
              onClick={() => updateAccent(c)}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}

function PreferencesSection({ user, updateUser, showToast }) {
  const handleToggle = async (key, val) => {
    try {
      const res = await api.put('/auth/profile', { preferences: { ...user.preferences, [key]: val } })
      if (res.data.success) updateUser(res.data.data)
    } catch {
      showToast('Failed to save preference', 'error')
    }
  }

  const p = user.preferences || {}

  return (
    <Section title="Preferences" sub="Control how AI LifeOS behaves.">
      <Toggle 
        title="Week starts on Monday" 
        desc="Change first day of the week in calendar views." 
        checked={p.weekStartsOn === 1}
        onChange={(v) => handleToggle('weekStartsOn', v ? 1 : 0)}
      />
      <Toggle 
        title="Show completed tasks" 
        desc="Keep completed tasks visible instead of hiding them." 
        checked={p.showCompleted !== false} // default true
        onChange={(v) => handleToggle('showCompleted', v)}
      />
      <Toggle 
        title="Compact mode" 
        desc="Fit more info on screen with tighter spacing." 
        checked={p.compactMode === true}
        onChange={(v) => handleToggle('compactMode', v)}
      />
    </Section>
  )
}

function NotificationsSection() {
  return (
    <Section title="Notifications" sub="Choose what you want to be reminded about. (Coming Soon)">
      <div style={{ padding: 16, background: 'var(--surface-200)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: 14 }}>
        Email and push notifications are currently being built. Stay tuned!
      </div>
    </Section>
  )
}

function AccountSection({ showToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handlePassword = async () => {
    if (form.newPassword !== form.confirmPassword) return showToast('Passwords do not match', 'error')
    if (form.newPassword.length < 6) return showToast('New password must be at least 6 characters', 'error')
    
    setLoading(true)
    try {
      const res = await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      if (res.data.success) {
        showToast('Password updated successfully', 'success')
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update password', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)
    try {
      await api.delete('/auth/account')
      logout()
      navigate('/login')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete account', 'error')
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/auth/export')
      const dataStr = JSON.stringify(res.data.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ailifeos_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('Data exported successfully', 'success')
    } catch (err) {
      showToast('Failed to export data', 'error')
    }
  }

  return (
    <Section title="Account & Security" sub="Manage your account credentials and access.">
      <div className="set-field">
        <label>Current Password</label>
        <input type="password" value={form.currentPassword} onChange={e => setForm({...form, currentPassword: e.target.value})} placeholder="••••••••" />
      </div>
      <div className="set-row">
        <div className="set-field">
          <label>New Password</label>
          <input type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} />
        </div>
        <div className="set-field">
          <label>Confirm Password</label>
          <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
        </div>
      </div>
      <div className="set-actions">
        <button className="set-btn set-btn--primary" onClick={handlePassword} disabled={loading || !form.currentPassword || !form.newPassword}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </div>

      <div className="set-danger" style={{ marginTop: 24, borderColor: 'var(--border-color)', background: 'transparent' }}>
        <h4>Export Data</h4>
        <p>Download a copy of all your data (tasks, notes, goals, etc) in JSON format.</p>
        <button className="set-btn set-btn--secondary" onClick={handleExport} style={{ marginTop: 16 }}>
          <Download size={14} /> Export My Data
        </button>
      </div>

      <div className="set-danger" style={{ marginTop: 24 }}>
        <h4>Danger Zone</h4>
        <p>Deleting your account is permanent. All data will be irrevocably lost.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <input 
            type="text" 
            placeholder="Type DELETE to confirm" 
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-200)', color: 'inherit', flex: 1 }}
          />
          <button 
            className="set-btn set-btn--danger" 
            disabled={deleteInput !== 'DELETE' || deleting}
            onClick={handleDelete}
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </Section>
  )
}

function BillingSection() {
  return (
    <Section title="Billing" sub="Manage your subscription and payment methods.">
      <div className="set-plan">
        <div>
          <div className="set-plan__badge">CURRENT PLAN</div>
          <div className="set-plan__name">Pro (Lifetime Free)</div>
          <p>Early adopter access. Unlimited AI, all features.</p>
        </div>
        <div className="set-plan__price">$0<span>/month</span></div>
      </div>
    </Section>
  )
}

function Toggle({ title, desc, checked, onChange }) {
  return (
    <div className="set-toggle">
      <div>
        <div className="set-toggle__title">{title}</div>
        <div className="set-toggle__desc">{desc}</div>
      </div>
      <button
        className={`set-switch${checked ? ' set-switch--on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span></span>
      </button>
    </div>
  )
}
