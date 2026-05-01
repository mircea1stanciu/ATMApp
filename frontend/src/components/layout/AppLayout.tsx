import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity, BarChart2, FolderGit2, LayoutDashboard,
  LogOut, Menu, X, Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

const NAV = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects',  label: 'Proiecte',  icon: FolderGit2 },
  { to: '/runs',      label: 'Test Runs', icon: Activity },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
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

  const hasRunning = runs.some(r => r.status === 'running')

  const handleLogout = () => { logout(); navigate('/login') }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white">TestManager</span>
          <p className="text-[10px] text-slate-500">Automation Platform</p>
        </div>
      </div>

      {/* Project selector */}
      <div className="px-4 pb-4">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Proiect activ
        </label>
        <select
          value={selectedProjectId || ''}
          onChange={e => setSelectedProjectId(e.target.value || null)}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
        >
          {projects.length === 0 && <option value="">Niciun proiect</option>}
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="mx-4 border-t border-white/[0.04]" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.06] text-white shadow-sm'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  <item.icon size={16} />
                </div>
                {item.label}
                {item.to === '/runs' && hasRunning && (
                  <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.04] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/20">
            {user?.full_name?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {user?.full_name || user?.email || 'User'}
            </p>
            <p className="text-[11px] capitalize text-slate-500">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.04] hover:text-red-400"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Desktop sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/[0.04] bg-[#0d0d14] md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[280px] flex-col bg-[#0d0d14] shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:text-white">
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-white/[0.04] bg-[#0d0d14]/80 px-4 py-3 backdrop-blur-xl md:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-400 hover:text-white">
            <Menu size={18} />
          </button>
          <span className="text-sm font-bold text-white">TestManager</span>
        </header>

        {/* Page content — fills viewport, no outer scroll */}
        <main className="flex-1 overflow-hidden p-3 md:p-6">
          <div className="mx-auto h-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
