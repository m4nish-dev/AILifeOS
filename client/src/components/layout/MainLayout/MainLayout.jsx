import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Topbar from '../Topbar/Topbar'
import { VoiceMount } from '../../../voice/components/VoiceMount'
import './MainLayout.css'

export default function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="layout">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="layout__main">
        <Topbar toggleMobileMenu={() => setIsMobileOpen(prev => !prev)} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
      <VoiceMount />
    </div>
  )
}
