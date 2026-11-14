import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'
import GlobalSearch from '../../common/GlobalSearch/GlobalSearch'
import ShortcutsHelp from '../../common/ShortcutsHelp/ShortcutsHelp'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts'
import './MainLayout.css'

export default function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Alt+[key] navigation and Shift+? for the shortcuts modal.
  useKeyboardShortcuts()

  return (
    <div className="layout">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="layout__main">
        <Topbar toggleMobileMenu={() => setIsMobileOpen(prev => !prev)} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>

      {/* Global overlays — rendered once for every authenticated route.
          Each manages its own open state (Cmd+K / Shift+?). */}
      <GlobalSearch />
      <ShortcutsHelp />
    </div>
  )
}
