import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Alt + <key> → route. Keyed by KeyboardEvent.code because on macOS
// Option+D produces "∂" rather than "d", which made e.key matching fail.
const NAV_SHORTCUTS = {
  KeyD: '/dashboard',
  KeyT: '/tasks',
  KeyG: '/goals',
  KeyC: '/calendar',
  KeyN: '/notes',
  KeyS: '/study',
  KeyA: '/assistant',
}

const isTypingTarget = (target) => {
  if (!target) return false
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true
  return Boolean(target.isContentEditable)
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl+K is owned by GlobalSearch and must work from anywhere.

      // Never hijack keys while the user is typing.
      if (isTypingTarget(e.target)) return

      // Shift + ? opens the shortcuts help modal.
      if (e.key === '?') {
        e.preventDefault()
        window.dispatchEvent(new Event('toggle-shortcuts-help'))
        return
      }

      // Alt/Option + <letter> navigates. Ignore when Cmd/Ctrl is also held so
      // we don't shadow browser or OS shortcuts.
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const path = NAV_SHORTCUTS[e.code]
        if (path) {
          e.preventDefault()
          navigate(path)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}

export default useKeyboardShortcuts
