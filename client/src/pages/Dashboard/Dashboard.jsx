import WelcomeHeader from '../../components/dashboard/WelcomeHeader/WelcomeHeader'
import StatsCards from '../../components/dashboard/StatsCards/StatsCards'
import TodaysPlan from '../../components/dashboard/TodaysPlan/TodaysPlan'
import AIInsight from '../../components/dashboard/AIInsight/AIInsight'
import ProductivityOverview from '../../components/dashboard/ProductivityOverview/ProductivityOverview'
import QuickActions from '../../components/dashboard/QuickActions/QuickActions'
import RecentActivity from '../../components/dashboard/RecentActivity/RecentActivity'
import MiniCalendar from '../../components/dashboard/MiniCalendar/MiniCalendar'
import FocusRing from '../../components/dashboard/FocusRing/FocusRing'
import ActiveGoalsPanel from '../../components/dashboard/ActiveGoalsPanel/ActiveGoalsPanel'
import AssistantMini from '../../components/dashboard/AssistantMini/AssistantMini'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { firstName } = useAuth()
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
        <FocusRing />
        <ActiveGoalsPanel />
        <AssistantMini />
      </aside>
    </div>
  )
}
