import { createContext, useContext, useEffect } from 'react'

// AI LifeOS ships a single theme. The provider keeps its old API (theme,
// resolvedTheme, setTheme, toggleTheme) so nothing that imports it can break,
// but every value is fixed and the setters are no-ops.
const ThemeContext = createContext()

const STORAGE_KEY = 'ailifeos-theme'
const THEME = 'light'

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Stylesheets scope their single-theme rules to [data-theme="light"].
    document.documentElement.setAttribute('data-theme', THEME)
    // Drop any stale dark/system preference saved by earlier versions.
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* storage blocked */ }
  }, [])

  const noop = () => {}

  return (
    <ThemeContext.Provider value={{ theme: THEME, resolvedTheme: THEME, setTheme: noop, toggleTheme: noop }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
