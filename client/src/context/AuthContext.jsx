import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API = 'http://localhost:5001/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ailifeos-user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  // Sync fresh user data from the backend on mount if we have a token
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('ailifeos-token')
    if (!token) return

    try {
      setLoading(true)
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data?.user) {
        setUser(data.data.user)
        localStorage.setItem('ailifeos-user', JSON.stringify(data.data.user))
      }
    } catch {
      // Keep stale user from localStorage if network fails
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = (userData, token) => {
    localStorage.setItem('ailifeos-token', token)
    localStorage.setItem('ailifeos-user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ailifeos-token')
    localStorage.removeItem('ailifeos-user')
    setUser(null)
  }

  // Derive initials from name (e.g. "Dhruv Kumar" → "DK")
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  // First name only (e.g. "Dhruv Kumar" → "Dhruv")
  const firstName = user?.name ? user.name.split(' ')[0] : ''

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, initials, firstName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
