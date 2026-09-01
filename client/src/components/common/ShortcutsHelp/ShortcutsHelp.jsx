import { useEffect, useState } from 'react'
import { X, Command, Option } from 'lucide-react'
import './ShortcutsHelp.css'

const shortcuts = [
  { section: 'Global', keys: [
    { label: 'Global Search', kbd: ['⌘', 'K'] },
    { label: 'Show this help menu', kbd: ['Shift', '?'] },
  ]},
  { section: 'Navigation', keys: [
    { label: 'Go to Dashboard', kbd: ['⌥', 'D'] },
    { label: 'Go to Tasks', kbd: ['⌥', 'T'] },
    { label: 'Go to Goals', kbd: ['⌥', 'G'] },
    { label: 'Go to Calendar', kbd: ['⌥', 'C'] },
    { label: 'Go to Notes', kbd: ['⌥', 'N'] },
    { label: 'Go to Study', kbd: ['⌥', 'S'] },
    { label: 'Go to AI Assistant', kbd: ['⌥', 'A'] },
  ]},
  { section: 'Actions (When applicable)', keys: [
    { label: 'Close Modal', kbd: ['Esc'] },
    { label: 'Submit Form', kbd: ['Enter'] },
  ]}
]

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setOpen(prev => !prev)
    window.addEventListener('toggle-shortcuts-help', handleToggle)
    return () => window.removeEventListener('toggle-shortcuts-help', handleToggle)
  }, [])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open])

  if (!open) return null

  return (
    <div className="sh__backdrop" onClick={() => setOpen(false)}>
      <div className="sh__modal" onClick={e => e.stopPropagation()}>
        <div className="sh__header">
          <h2>Keyboard Shortcuts</h2>
          <button onClick={() => setOpen(false)} className="sh__close"><X size={18} /></button>
        </div>
        <div className="sh__body">
          {shortcuts.map((group, i) => (
            <div key={i} className="sh__group">
              <h3>{group.section}</h3>
              <ul>
                {group.keys.map((s, j) => (
                  <li key={j}>
                    <span>{s.label}</span>
                    <div className="sh__kbds">
                      {s.kbd.map((k, kIdx) => (
                        <span key={kIdx} className="sh__kbd">{k}</span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
