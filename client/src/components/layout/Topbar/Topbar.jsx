import { Search, Bell, Flame, Command, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../../context/AuthContext'
import './Topbar.css'

export default function Topbar({ toggleMobileMenu }) {
  const { theme, toggleTheme } = useTheme()
  const { initials } = useAuth()

  return (
    <header className="topbar">
      <button className="topbar__menu-toggle" onClick={toggleMobileMenu}>
        <Menu size={20} />
      </button>

      <div className="topbar__search">
        <Search size={17} className="topbar__search-icon" />
        <input
          type="text"
          placeholder="Search tasks, notes, goals…"
          className="topbar__search-input"
        />
        <span className="topbar__search-kbd">
          <Command size={11} /> K
        </span>
      </div>

      <div className="topbar__actions">
        <div className="topbar__streak">
          <Flame size={14} className="topbar__streak-icon" />
          <span>12 day streak</span>
        </div>

        <button
          className="topbar__icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <button className="topbar__icon-btn topbar__icon-btn--notif">
          <Bell size={18} strokeWidth={2} />
          <span className="topbar__dot" />
        </button>

        <button className="topbar__avatar">{initials ? initials[0] : '?'}</button>
      </div>
    </header>
  )
}
