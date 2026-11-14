import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense } from 'react'
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
import Landing from './pages/Landing/Landing'
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary'

const isAuthed = () => Boolean(localStorage.getItem('ailifeos-token'))

// Simple auth guard — checks for JWT token in localStorage
function PrivateRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/signin" replace />
}

// Signed-in users shouldn't land on the marketing page or auth screens.
function PublicOnlyRoute({ children }) {
  return isAuthed() ? <Navigate to="/dashboard" replace /> : children
}

// Isolates a single route so one crashing page doesn't blank the whole app.
// Keying on pathname resets the boundary when the user navigates away.
function RouteBoundary({ children }) {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Marketing landing page for visitors; signed-in users go to the app */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <RouteBoundary><Landing /></RouteBoundary>
            </PublicOnlyRoute>
          }
        />

        {/* Auth routes (no layout) */}
        <Route path="/signin" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* Legacy route aliases — keep working */}
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* Protected app routes (with layout) */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<RouteBoundary><Dashboard /></RouteBoundary>} />
          <Route path="/tasks" element={<RouteBoundary><Tasks /></RouteBoundary>} />
          <Route path="/goals" element={<RouteBoundary><Goals /></RouteBoundary>} />
          <Route path="/calendar" element={<RouteBoundary><Calendar /></RouteBoundary>} />
          <Route path="/notes" element={<RouteBoundary><Notes /></RouteBoundary>} />
          <Route path="/study" element={<RouteBoundary><Study /></RouteBoundary>} />
          <Route path="/assistant" element={<RouteBoundary><AIAssistant /></RouteBoundary>} />
          <Route path="/analytics" element={<RouteBoundary><Analytics /></RouteBoundary>} />
          <Route path="/settings" element={<RouteBoundary><Settings /></RouteBoundary>} />
          <Route path="/profile" element={<RouteBoundary><Profile /></RouteBoundary>} />
        </Route>

        {/* Catch-all — send signed-in users to the app, visitors to the landing page */}
        <Route path="*" element={<Navigate to={isAuthed() ? '/dashboard' : '/'} replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
