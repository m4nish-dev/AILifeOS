import WelcomeHeader from '../../components/dashboard/WelcomeHeader/WelcomeHeader'
import StatsCards from '../../components/dashboard/StatsCards/StatsCards'
import TodaysPlan from '../../components/dashboard/TodaysPlan/TodaysPlan'
import AIInsight from '../../components/dashboard/AIInsight/AIInsight'
import ProductivityOverview from '../../components/dashboard/ProductivityOverview/ProductivityOverview'
import QuickActions from '../../components/dashboard/QuickActions/QuickActions'
import RecentActivity from '../../components/dashboard/RecentActivity/RecentActivity'
import MiniCalendar from '../../components/dashboard/MiniCalendar/MiniCalendar'
import ActiveGoalsPanel from '../../components/dashboard/ActiveGoalsPanel/ActiveGoalsPanel'
import AssistantMini from '../../components/dashboard/AssistantMini/AssistantMini'
import { useAuth } from '../../context/AuthContext'
import { studyService } from '../../services/studyService'
import { useState, useEffect } from 'react'
import { Flame, Clock } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { firstName } = useAuth()
  const [studyStats, setStudyStats] = useState(null)

  useEffect(() => {
    studyService.getStats().then(setStudyStats).catch(console.error)
  }, [])

  return (
    <div className="dash">
      <div className="dash__main">
        <WelcomeHeader name={firstName} />
        <StatsCards />
        <TodaysPlan />
        <AIInsight />

        <div className="dash__triple">
          <ProductivityOverview />
          <QuickActions />
          <RecentActivity />
        </div>

      </div>

      <aside className="dash__aside">
        <MiniCalendar />
        
        {/* Study Progress Widget */}
        <div className="study-stat-card" style={{ padding: '20px' }}>
          <div className="study-stat__header" style={{ marginBottom: 12 }}>
            <Clock size={16} className="text-blue-500" /> Study Progress
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Today</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{studyStats?.totalMinutesToday || 0}<span style={{fontSize: 12, fontWeight: 'normal', color: 'var(--text-tertiary)'}}>m</span></div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Streak</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--amber-500)' }}><Flame size={16} style={{display:'inline', marginBottom: 2}}/> {studyStats?.currentStreak || 0}</div>
            </div>
          </div>
        </div>

        <ActiveGoalsPanel />
        <AssistantMini />
      </aside>
    </div>
  )
}
