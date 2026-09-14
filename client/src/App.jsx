import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout/MainLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import Tasks from './pages/Tasks/Tasks'
import Goals from './pages/Goals/Goals'
import Calendar from './pages/Calendar/Calendar'
import Notes from './pages/Notes/Notes'
import Study from './pages/Study/Study'
import AIAssistant from './pages/AIAssistant/AIAssistant'
import Analytics from './pages/Analytics/Analytics'
import Settings from './pages/Settings/Settings'
import Profile from './pages/Profile/Profile'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary'

// Simple auth guard — checks for JWT token in localStorage
function PrivateRoute({ children }) {
  const token = localStorage.getItem('ailifeos-token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Auth routes (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected app routes (with layout) */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/study" element={<Study />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
