import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Flame, Command, Sun, Moon, Menu, CheckCheck, Trash2 } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import { useAuth } from '../../../context/AuthContext'
import { notificationService } from '../../../services/notificationService'
import { studyService } from '../../../services/studyService'
import './Topbar.css'

// Compact relative time, e.g. "just now", "4m ago", "3d ago".
const timeAgo = (date) => {
  const then = new Date(date).getTime()
  if (Number.isNaN(then)) return ''

  const seconds = Math.floor((Date.now() - then) / 1000)
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(then).toLocaleDateString()
}

export default function Topbar({ toggleMobileMenu }) {
  const { theme, toggleTheme } = useTheme()
  const { initials } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifError, setNotifError] = useState('')

  const [streak, setStreak] = useState(0)

  const notifRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true)
    setNotifError('')
    try {
      const { notifications: list, unreadCount: count } = await notificationService.getNotifications()
      setNotifications(list)
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to load notifications', err)
      setNotifError('Could not load notifications.')
    } finally {
      setNotifLoading(false)
    }
  }, [])

  // Fetch once on mount (no polling — refreshed after each action instead).
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Real focus streak, replacing the previously hardcoded value.
  useEffect(() => {
    let cancelled = false
    studyService
      .getStats()
      .then((stats) => {
        if (!cancelled) setStreak(stats?.currentStreak || 0)
      })
      .catch(() => {
        // A missing streak is not worth surfacing — the chip just stays hidden.
      })
    return () => { cancelled = true }
  }, [])

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!notifOpen) return

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setNotifOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleEsc)
    }
  }, [notifOpen])

  const openSearch = () => window.dispatchEvent(new Event('open-global-search'))

  const handleNotifClick = async (notification) => {
    if (!notification.read) {
      // Optimistic: reflect the read state immediately.
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      try {
        await notificationService.markRead(notification.id)
      } catch (err) {
        console.error('Failed to mark notification read', err)
        loadNotifications() // Re-sync if the server rejected it.
      }
    }

    if (notification.link) {
      setNotifOpen(false)
      navigate(notification.link)
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await notificationService.markAllRead()
    } catch (err) {
      console.error('Failed to mark all read', err)
      loadNotifications()
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation() // Don't trigger navigation on the parent item.

    const removed = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (removed && !removed.read) setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await notificationService.deleteNotification(id)
    } catch (err) {
      console.error('Failed to delete notification', err)
      loadNotifications()
    }
  }

  return (
    <header className="topbar">
      <button className="topbar__menu-toggle" onClick={toggleMobileMenu}>
        <Menu size={20} />
      </button>

      {/* Read-only: clicking/focusing hands off to the GlobalSearch overlay,
          which owns the actual input and results. */}
      <div className="topbar__search" onClick={openSearch} role="button" tabIndex={-1}>
        <Search size={17} className="topbar__search-icon" />
        <input
          type="text"
          readOnly
          placeholder="Search tasks, notes, goals…"
          className="topbar__search-input"
          onFocus={openSearch}
          onClick={openSearch}
          aria-label="Open global search"
        />
        <span className="topbar__search-kbd">
          <Command size={11} /> K
        </span>
      </div>

      <div className="topbar__actions">
        {streak > 0 && (
          <div className="topbar__streak">
            <Flame size={14} className="topbar__streak-icon" />
            <span>{streak} day streak</span>
          </div>
        )}

        <button
          className="topbar__icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <div className="topbar__notif-container" ref={notifRef}>
          <button
            className="topbar__icon-btn topbar__icon-btn--notif"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            aria-expanded={notifOpen}
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="topbar__dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="topbar__notif-dropdown">
              <div className="topbar__notif-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="topbar__mark-read-btn" onClick={handleMarkAllRead}>
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="topbar__notif-list">
                {notifLoading && <div className="topbar__notif-empty">Loading…</div>}

                {!notifLoading && notifError && (
                  <div className="topbar__notif-empty topbar__notif-error">{notifError}</div>
                )}

                {!notifLoading && !notifError && notifications.length === 0 && (
                  <div className="topbar__notif-empty">You're all caught up.</div>
                )}

                {!notifLoading && !notifError && notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`topbar__notif-item${n.read ? '' : ' topbar__notif-item--unread'}`}
                    onClick={() => handleNotifClick(n)}
                  >
                    <div className="topbar__notif-row">
                      <div className="topbar__notif-title">{n.title}</div>
                      <button
                        className="topbar__notif-delete"
                        onClick={(e) => handleDelete(e, n.id)}
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="topbar__notif-msg">{n.message}</div>
                    <div className="topbar__notif-time">{timeAgo(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="topbar__avatar">{initials ? initials[0] : '?'}</button>
      </div>
    </header>
  )
}
