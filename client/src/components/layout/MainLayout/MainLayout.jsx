import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'
import GlobalSearch from '../../common/GlobalSearch/GlobalSearch'
import ShortcutsHelp from '../../common/ShortcutsHelp/ShortcutsHelp'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts'
import './MainLayout.css'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useKeyboardShortcuts()

  return (
    <div className="layout">
      {sidebarOpen && <div className="layout__backdrop" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout__main">
        <Topbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
      <ShortcutsHelp />
    </div>
  )
}
