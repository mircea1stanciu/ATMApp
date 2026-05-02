import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity, BarChart2, FolderGit2, Github, LayoutDashboard,
  LogOut, Menu, Moon, Settings, Sun, Users, X, Zap,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { ROLE_LABELS, canAccess } from '@/types/domain'
import type { UserRole } from '@/types/domain'
import { apiService } from '@/services/api'

const NAV = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects',  label: 'Projects',  icon: FolderGit2 },
  { to: '/runs',      label: 'Test Runs', icon: Activity },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/users',     label: 'Users',     icon: Users },
  { to: '/settings',  label: 'Settings',  icon: Settings },
]

export default function AppLayout() {
  const user = useAppStore(s => s.user)
  const projects = useAppStore(s => s.projects)
  const selectedProjectId = useAppStore(s => s.selectedProjectId)
  const setSelectedProjectId = useAppStore(s => s.setSelectedProjectId)
  const runs = useAppStore(s => s.runs)
  const logout = useAppStore(s => s.logout)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const hasRunning = runs.some(r => r.status === 'running')
  const handleLogout = () => { logout(); navigate('/login') }

  // GitHub connection status: null = unknown, 'none' = no token, 'ok' = connected, 'error' = failed
  const [ghStatus, setGhStatus] = useState<'none' | 'ok' | 'error'>('none')

  useEffect(() => {
    if (!user?.role) return
    const isAdmin = user.role === 'admin'
    const isLead = user.role === 'automation_lead'

    if (isAdmin) {
      // Admin checks the global token
      apiService.getSettings()
        .then(data => {
          if (!data.github_token_set) { setGhStatus('none'); return }
          return apiService.testGithubConnection().then(r => setGhStatus(r.ok ? 'ok' : 'error'))
        })
        .catch(() => setGhStatus('error'))
    } else if (isLead && selectedProjectId) {
      // Lead checks the per-project token
      apiService.getProjectGithub(selectedProjectId)
        .then(data => {
          if (!data.github_token_set) { setGhStatus('none'); return }
          return apiService.testProjectGithub(selectedProjectId).then(r => setGhStatus(r.ok ? 'ok' : 'error'))
        })
        .catch(() => setGhStatus('none'))
    } else {
      setGhStatus('none')
    }
  }, [user?.role, selectedProjectId])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">AutomationTestManager</span>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">(ATM)</p>
        </div>
      </div>

      {/* Project selector */}
      <div className="px-4 py-4">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Active Project
        </label>
        <select
          value={selectedProjectId || ''}
          onChange={e => setSelectedProjectId(e.target.value || null)}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {projects.length === 0 && <option value="">No projects</option>}
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="mx-4 border-t border-gray-200 dark:border-gray-700" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.filter(item => canAccess(user?.role, item.to)).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`}>
                  <item.icon size={16} />
                </div>
                {item.label}
                {item.to === '/runs' && hasRunning && (
                  <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white shadow-sm">
            {user?.full_name?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {user?.full_name || user?.email || 'User'}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {ROLE_LABELS[user?.role as UserRole] ?? user?.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[280px] flex-col bg-white dark:bg-gray-900 shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white md:hidden">
            <Menu size={18} />
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white md:hidden">AutomationTestManager (ATM)</span>
          <div className="hidden md:flex items-center gap-2 flex-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {NAV.find(n => n.to === location.pathname)?.label ?? 'AutomationTestManager'}
            </span>
          </div>
          <button
            onClick={() => setIsDark(d => !d)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
            title="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {/* GitHub connection indicator */}
          <div
            className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 select-none"
            title={
              ghStatus === 'ok' ? 'GitHub: Connected' :
              ghStatus === 'error' ? 'GitHub: Connection error' :
              'GitHub: Not connected'
            }
          >
            <Github size={13} className={
              ghStatus === 'ok' ? 'text-emerald-500' :
              ghStatus === 'error' ? 'text-red-500' :
              'text-gray-400'
            } />
            <span className={`h-2 w-2 rounded-full ${
              ghStatus === 'ok' ? 'bg-emerald-500' :
              ghStatus === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden p-3 md:p-6">
          <div className="mx-auto h-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
