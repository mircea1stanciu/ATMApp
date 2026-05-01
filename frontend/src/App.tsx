import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProjectsPage from '@/pages/ProjectsPage'
import RunsPage from '@/pages/RunsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAppStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function InitLoader({ children }: { children: React.ReactNode }) {
  const token = useAppStore(s => s.token)
  const loadInitialData = useAppStore(s => s.loadInitialData)

  useEffect(() => {
    if (token) void loadInitialData()
  }, [token, loadInitialData])

  return <>{children}</>
}

function LoginGuard() {
  const token = useAppStore(s => s.token)
  if (token) return <Navigate to="/" replace />
  return <LoginPage />
}

export default function App() {
  const location = useLocation()

  return (
    <InitLoader>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginGuard />} />
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="runs" element={<RunsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </InitLoader>
  )
}
