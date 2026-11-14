import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

const STORAGE_KEY = 'ailifeos-theme'
const VALID = ['light', 'dark', 'system']

const prefersDark = () =>
  typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }) {
  // `theme` is the user's *preference* (light | dark | system).
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'system'
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return VALID.includes(stored) ? stored : 'system'
    } catch {
      return 'system'
    }
  })

  // `resolvedTheme` is what's actually applied (light | dark).
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme
  )

  useEffect(() => {
    const resolve = () => (theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme)

    const apply = () => {
      const next = resolve()
      setResolvedTheme(next)
      document.documentElement.setAttribute('data-theme', next)
    }

    apply()

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private browsing / blocked storage — the theme still applies for this session.
    }

    // While on "system", follow live OS changes.
    if (theme !== 'system' || !window.matchMedia) return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  // Toggling flips the *effective* theme and pins it as an explicit choice.
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
