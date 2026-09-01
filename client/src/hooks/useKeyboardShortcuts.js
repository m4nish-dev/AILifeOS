import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Allow Cmd+K to pass through even if in input (handled by GlobalSearch)
      
      // Ignore other shortcuts if we are inside an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

      // Shift + ? to show help
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault()
        window.dispatchEvent(new Event('toggle-shortcuts-help'))
        return
      }

      // App navigation: G then [Key]
      // Alternatively, simple shortcuts:
      // g d = dashboard, g t = tasks, g g = goals
      // To implement sequence, we'd need state. For simplicity, let's use Ctrl+Shift+[Key] or just Alt+[Key]
      // Let's use Alt + [Key] (Option on Mac)
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'd': e.preventDefault(); navigate('/dashboard'); break
          case 't': e.preventDefault(); navigate('/tasks'); break
          case 'g': e.preventDefault(); navigate('/goals'); break
          case 'c': e.preventDefault(); navigate('/calendar'); break
          case 'n': e.preventDefault(); navigate('/notes'); break
          case 's': e.preventDefault(); navigate('/study'); break
          case 'a': e.preventDefault(); navigate('/assistant'); break
          default: break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}
