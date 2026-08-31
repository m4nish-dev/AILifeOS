import { useState } from 'react'
import { User, Palette, Bell, Shield, CreditCard, Sun, Moon, Monitor, Check, Camera } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
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
          {active === 'profile' && <ProfileSection />}
          {active === 'theme' && <ThemeSection theme={theme} setTheme={setTheme} />}
          {active === 'preferences' && <PreferencesSection />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'account' && <AccountSection />}
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

function ProfileSection() {
  return (
    <Section title="Profile" sub="This is how others see you on the platform.">
      <div className="set-avatar">
        <div className="set-avatar__img">MK</div>
        <div>
          <button className="set-btn set-btn--ghost"><Camera size={13} /> Change photo</button>
          <p className="set-hint">JPG, PNG, or GIF. Max 2MB.</p>
        </div>
      </div>

      <div className="set-row">
        <div className="set-field"><label>First Name</label><input defaultValue="Manish" /></div>
        <div className="set-field"><label>Last Name</label><input defaultValue="Kumar" /></div>
      </div>
      <div className="set-field"><label>Email</label><input type="email" defaultValue="manish@example.com" /></div>
      <div className="set-field"><label>Bio</label><textarea rows={3} defaultValue="MERN developer building AI-powered tools." /></div>

      <div className="set-actions">
        <button className="set-btn set-btn--ghost">Cancel</button>
        <button className="set-btn set-btn--primary"><Check size={13} strokeWidth={2.5} /> Save changes</button>
      </div>
    </Section>
  )
}

function ThemeSection({ theme, setTheme }) {
  const options = [
    { id: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
    { id: 'system', label: 'System', icon: Monitor, desc: 'Match your device' },
  ]
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
        <label>Accent Color</label>
        <div className="set-colors">
          {['green', 'coffee', 'blue', 'purple', 'red'].map((c, i) => (
            <button key={c} className={`set-color set-color--${c}${i === 0 ? ' set-color--active' : ''}`} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function PreferencesSection() {
  return (
    <Section title="Preferences" sub="Control how AI LifeOS behaves.">
      <Toggle title="Week starts on Monday" desc="Change first day of the week in calendar views." />
      <Toggle title="Show completed tasks" desc="Keep completed tasks visible instead of hiding them." defaultChecked />
      <Toggle title="AI-suggest task order" desc="Let AI reorder your day based on energy and priorities." defaultChecked />
      <Toggle title="Compact mode" desc="Fit more info on screen with tighter spacing." />
      <Toggle title="Auto-summarize notes" desc="Generate summaries automatically when notes get long." defaultChecked />
    </Section>
  )
}

function NotificationsSection() {
  return (
    <Section title="Notifications" sub="Choose what you want to be reminded about.">
      <Toggle title="Daily plan digest" desc="Get your day's plan delivered at 8:00 AM." defaultChecked />
      <Toggle title="Task reminders" desc="Nudges 15 mins before scheduled tasks." defaultChecked />
      <Toggle title="Goal milestones" desc="Celebrate when you hit a milestone." defaultChecked />
      <Toggle title="Weekly review" desc="Every Sunday, get an AI-generated week recap." defaultChecked />
      <Toggle title="Marketing emails" desc="Product updates and tips from our team." />
    </Section>
  )
}

function AccountSection() {
  return (
    <Section title="Account & Security" sub="Manage your account credentials and access.">
      <div className="set-field"><label>Current Password</label><input type="password" placeholder="••••••••" /></div>
      <div className="set-row">
        <div className="set-field"><label>New Password</label><input type="password" /></div>
        <div className="set-field"><label>Confirm Password</label><input type="password" /></div>
      </div>
      <div className="set-actions">
        <button className="set-btn set-btn--primary">Update password</button>
      </div>

      <div className="set-danger">
        <h4>Danger Zone</h4>
        <p>Deleting your account is permanent. All data will be lost.</p>
        <button className="set-btn set-btn--danger">Delete Account</button>
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
          <div className="set-plan__name">Pro</div>
          <p>Unlimited AI, all features, priority support.</p>
        </div>
        <div className="set-plan__price">$12<span>/month</span></div>
      </div>
      <div className="set-actions">
        <button className="set-btn set-btn--ghost">Change plan</button>
        <button className="set-btn set-btn--ghost">Cancel subscription</button>
      </div>
    </Section>
  )
}

function Toggle({ title, desc, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked || false)
  return (
    <div className="set-toggle">
      <div>
        <div className="set-toggle__title">{title}</div>
        <div className="set-toggle__desc">{desc}</div>
      </div>
      <button
        className={`set-switch${checked ? ' set-switch--on' : ''}`}
        onClick={() => setChecked(!checked)}
        aria-pressed={checked}
      >
        <span></span>
      </button>
    </div>
  )
}
