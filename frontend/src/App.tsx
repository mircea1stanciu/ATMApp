import { useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { canAccess } from '@/types/domain'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import JiraProjectsPage from '@/pages/JiraProjectsPage'
import ProjectsPage from '@/pages/ProjectsPage'
import RunsPage from '@/pages/RunsPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import UsersPage from '@/pages/UsersPage'
import SettingsPage from '@/pages/SettingsPage'

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000
const INACTIVITY_WARNING_MS = 60 * 1000
const LAST_ACTIVITY_KEY = 'tm_last_activity_at'
const AUTH_EXPIRED_EVENT = 'atm:auth-expired'

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
  const navigate = useNavigate()
  const token = useAppStore(s => s.token)
  const logout = useAppStore(s => s.logout)
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0)
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(60)

  const forceLogoutToLogin = useCallback(() => {
    setShowInactivityWarning(false)
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  useEffect(() => {
    if (!token) {
      setShowInactivityWarning(false)
      return
    }

    const now = Date.now()
    const saved = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || now)
    const elapsedMs = now - saved
    if (elapsedMs >= INACTIVITY_TIMEOUT_MS) {
      forceLogoutToLogin()
      return
    }

    let warningTimeoutId: number | undefined
    let logoutTimeoutId: number | undefined

    const clearTimers = () => {
      if (warningTimeoutId) window.clearTimeout(warningTimeoutId)
      if (logoutTimeoutId) window.clearTimeout(logoutTimeoutId)
    }

    const scheduleTimeouts = (remainingMs: number) => {
      clearTimers()

      const warningDelay = remainingMs - INACTIVITY_WARNING_MS
      if (warningDelay <= 0) {
        setShowInactivityWarning(true)
        setWarningSecondsLeft(Math.max(1, Math.ceil(remainingMs / 1000)))
      } else {
        setShowInactivityWarning(false)
        warningTimeoutId = window.setTimeout(() => {
          setShowInactivityWarning(true)
          setWarningSecondsLeft(60)
        }, warningDelay)
      }

      logoutTimeoutId = window.setTimeout(() => {
        forceLogoutToLogin()
      }, remainingMs)
    }

    const resetInactivityTimer = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
      setShowInactivityWarning(false)
      setWarningSecondsLeft(60)
      scheduleTimeouts(INACTIVITY_TIMEOUT_MS)
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true })
    }

    scheduleTimeouts(INACTIVITY_TIMEOUT_MS - elapsedMs)

    return () => {
      clearTimers()
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, resetInactivityTimer)
      }
    }
  }, [token, forceLogoutToLogin, sessionRefreshKey])

  useEffect(() => {
    if (!showInactivityWarning || !token) return

    const intervalId = window.setInterval(() => {
      setWarningSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [showInactivityWarning, token])

  useEffect(() => {
    const onAuthExpired = () => {
      forceLogoutToLogin()
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired)
  }, [forceLogoutToLogin])

  return (
    <InitLoader>
      {showInactivityWarning && token && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Session expiring soon</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You have been inactive. Your session will expire in {warningSecondsLeft}s.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={forceLogoutToLogin}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Logout now
              </button>
              <button
                type="button"
                onClick={() => setSessionRefreshKey(k => k + 1)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Stay signed in
              </button>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginGuard />} />
          <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
            <Route index element={<DashboardPage />} />
            <Route path="jira-projects" element={<RoleGuard path="/jira-projects"><JiraProjectsPage /></RoleGuard>} />
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
