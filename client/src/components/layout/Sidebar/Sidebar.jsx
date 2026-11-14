import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Target, Calendar,
  StickyNote, BookOpen, Sparkles, BarChart3,
} from 'lucide-react'
import './Sidebar.css'

// `key` mirrors the existing Alt/Option shortcuts in useKeyboardShortcuts;
// it is only displayed here, the hook still owns the behaviour.
const navItems = [
  { to: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard, key: 'D' },
  { to: '/tasks',      label: 'Tasks',        icon: CheckSquare,     key: 'T' },
  { to: '/goals',      label: 'Goals',        icon: Target,          key: 'G' },
  { to: '/calendar',   label: 'Calendar',     icon: Calendar,        key: 'C' },
  { to: '/notes',      label: 'Notes',        icon: StickyNote,      key: 'N' },
  { to: '/study',      label: 'Study',        icon: BookOpen,        key: 'S' },
  { to: '/assistant',  label: 'AI Assistant', icon: Sparkles,        key: 'A' },
  { to: '/analytics',  label: 'Analytics',    icon: BarChart3 },
]

const MOD_KEY = typeof navigator !== 'undefined'
  && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '') ? '⌥' : 'Alt+'

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const closeMobile = () => {
    if (isMobileOpen && setIsMobileOpen) setIsMobileOpen(false)
  }

  return (
    <>
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
          onClick={closeMobile}
        />
      )}
      <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''} ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <div className="sidebar__logo-mark" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <div className="sidebar__logo-text">
              <span className="sidebar__logo-title">AI LifeOS</span>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(({ to, label, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobile}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
              {key && <kbd className="sidebar__kbd" aria-hidden="true">{MOD_KEY}{key}</kbd>}
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  )
}
