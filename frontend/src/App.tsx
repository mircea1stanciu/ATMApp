import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { canAccess } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ProjectsPage from '@/pages/ProjectsPage'
import RunsPage from '@/pages/RunsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import UsersPage from '@/pages/UsersPage'
import SettingsPage from '@/pages/SettingsPage'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAppStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const user = useAppStore(s => s.user)
  if (!canAccess(user?.role, path)) return <Navigate to="/" replace />
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
            <Route path="projects" element={<RoleGuard path="/projects"><ProjectsPage /></RoleGuard>} />
            <Route path="runs" element={<RoleGuard path="/runs"><RunsPage /></RoleGuard>} />
            <Route path="analytics" element={<RoleGuard path="/analytics"><AnalyticsPage /></RoleGuard>} />
            <Route path="users"     element={<RoleGuard path="/users"><UsersPage /></RoleGuard>} />
            <Route path="settings"  element={<RoleGuard path="/settings"><SettingsPage /></RoleGuard>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </InitLoader>
  )
}
