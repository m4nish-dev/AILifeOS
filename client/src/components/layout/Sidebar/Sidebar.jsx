import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Target, Calendar,
  StickyNote, BookOpen, Sparkles, BarChart3,
  Settings, Plus, ChevronRight, ChevronLeft, Briefcase, Code2, GraduationCap
} from 'lucide-react'
import UserMenu from '../UserMenu/UserMenu'
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

const DEFAULT_WORKSPACES = [
  { id: 'personal',    label: 'Personal',    icon: Briefcase, active: true },
  { id: 'development', label: 'Development', icon: Code2 },
  { id: 'learning',    label: 'Learning',    icon: GraduationCap },
]

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [workspaces, setWorkspaces] = useState(DEFAULT_WORKSPACES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newWsName, setNewWsName] = useState('')

  const handleNewWorkspace = (e) => {
    e.preventDefault()
    if (newWsName && newWsName.trim()) {
      setWorkspaces([...workspaces, { 
        id: newWsName.toLowerCase().replace(/\s+/g, '-'), 
        label: newWsName.trim(), 
        icon: Briefcase 
      }])
      setIsModalOpen(false)
      setNewWsName('')
    }
  }

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
              <span className="sidebar__logo-badge">Pro</span>
            </div>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(({ to, label, icon: Icon }) => (
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
            <li className="sidebar__ws sidebar__ws--add" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
              <Plus size={16} strokeWidth={2} />
              <span>New Workspace</span>
            </li>
          </ul>
        </div>

        <div className="sidebar__footer">
          <div className="sidebar__user-wrap" style={{ marginTop: 'auto', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start', width: '100%', padding: isCollapsed ? '16px 0' : '16px 12px' }}>
            <UserMenu isCollapsed={isCollapsed} />
          </div>
        </div>

        {isModalOpen && (
          <div className="sb-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="sb-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="sb-modal-title">Create Workspace</h3>
              <form onSubmit={handleNewWorkspace}>
                <input
                  type="text"
                  autoFocus
                  className="sb-modal-input"
                  placeholder="E.g., Personal, Work, Project X..."
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                />
                <div className="sb-modal-actions">
                  <button type="button" className="sb-btn sb-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="sb-btn sb-btn-primary" disabled={!newWsName.trim()}>Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
