import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Target, Calendar,
  StickyNote, BookOpen, Sparkles, BarChart3,
  Settings, Plus, ChevronRight, Briefcase, Code2, GraduationCap
} from 'lucide-react'
import UserMenu from '../UserMenu/UserMenu'
import { useToast } from '../../../context/ToastContext'
import './Sidebar.css'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/tasks',      label: 'Tasks',        icon: CheckSquare },
  { to: '/goals',      label: 'Goals',        icon: Target },
  { to: '/calendar',   label: 'Calendar',     icon: Calendar },
  { to: '/notes',      label: 'Notes',        icon: StickyNote },
  { to: '/study',      label: 'Study',        icon: BookOpen },
  { to: '/assistant',  label: 'AI Assistant', icon: Sparkles },
  { to: '/analytics',  label: 'Analytics',    icon: BarChart3 },
]

const workspaces = [
  { id: 'personal',    label: 'Personal',    icon: Briefcase, active: true },
  { id: 'development', label: 'Development', icon: Code2 },
  { id: 'learning',    label: 'Learning',    icon: GraduationCap },
]

export default function Sidebar({ isOpen, onClose }) {
  const { showToast } = useToast()
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <div className="sidebar__logo-mark">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-title">AI LifeOS</span>
            <span className="sidebar__logo-badge">Pro</span>
          </div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__section">
        <div className="sidebar__section-title">Workspaces</div>
        <ul className="sidebar__workspaces">
          {workspaces.map(({ id, label, icon: Icon, active }) => (
            <li
              key={id}
              className={`sidebar__ws${active ? ' sidebar__ws--active' : ''}`}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
            </li>
          ))}
          <li 
            className="sidebar__ws sidebar__ws--add"
            onClick={() => showToast('Custom workspaces coming soon', 'info')}
          >
            <Plus size={16} strokeWidth={2} />
            <span>New Workspace</span>
          </li>
        </ul>
      </div>

      <div className="sidebar__footer">
        <NavLink to="/settings" className={({ isActive }) => `sidebar__settings${isActive ? ' sidebar__link--active' : ''}`}>
          <Settings size={18} strokeWidth={2} />
          <span>Settings</span>
        </NavLink>

        <div className="sidebar__user-wrap" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', width: '100%', padding: '16px 0' }}>
          <UserMenu />
        </div>
      </div>
    </aside>
  )
}
