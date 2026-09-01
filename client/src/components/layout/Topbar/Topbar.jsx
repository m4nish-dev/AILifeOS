import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Flame, Command, Sun, Moon, Check, Menu } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import api from '../../../services/api'
import './Topbar.css'

export default function Topbar({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.data.notifications)
      setUnreadCount(data.data.unreadCount)
    } catch (err) {
      console.error(err)
    }
  }

  // Polling every 30s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.put(`/notifications/${notif._id}/read`)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
      } catch (err) {
        console.error(err)
      }
    }
    setShowDropdown(false)
    if (notif.link) {
      navigate(notif.link)
    }
  }

  const handleMarkAllRead = async (e) => {
    e.stopPropagation()
    try {
      await api.put('/notifications/read-all')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Cmd+K click in search bar
  const triggerCmdK = () => {
    const event = new KeyboardEvent('keydown', { metaKey: true, key: 'k' })
    window.dispatchEvent(event)
  }

  return (
    <header className="topbar">
      <button className="topbar__menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <div className="topbar__search">
        <Search size={17} className="topbar__search-icon" />
        <input
          type="text"
          placeholder="Search tasks, notes, goals…"
          className="topbar__search-input"
          onClick={triggerCmdK}
          readOnly
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

        <div className="topbar__notif-container" ref={dropdownRef}>
          <button 
            className="topbar__icon-btn topbar__icon-btn--notif"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && <span className="topbar__dot">{unreadCount}</span>}
          </button>

          {showDropdown && (
            <div className="topbar__notif-dropdown">
              <div className="topbar__notif-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="topbar__mark-read-btn">
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="topbar__notif-list">
                {notifications.length === 0 ? (
                  <div className="topbar__notif-empty">No notifications yet</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      className={`topbar__notif-item ${!n.read ? 'topbar__notif-item--unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="topbar__notif-title">{n.title}</div>
                      <div className="topbar__notif-msg">{n.message}</div>
                      <div className="topbar__notif-time">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="topbar__avatar">MK</button>
      </div>
    </header>
  )
}
