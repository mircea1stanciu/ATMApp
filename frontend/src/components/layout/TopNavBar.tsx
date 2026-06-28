'use client'

import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, BarChart2, Building2, FolderGit2, Github, LayoutDashboard,
  LogOut, Moon, Settings, Sun, Users, X, Zap, ChevronDown, Menu,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ROLE_LABELS, canAccess } from '@/types/domain'
import type { UserRole } from '@/types/domain'
import type { JiraProject } from '@/types/domain'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jira-projects', label: 'Jira Projects', icon: Building2 },
  { to: '/projects', label: 'GitHub Projects', icon: FolderGit2 },
  { to: '/runs', label: 'Test Runs', icon: Activity },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface TopNavBarProps {
  jiraProjects: JiraProject[]
  activeJiraProjectKey: string
  activeGitHubProjectLabel: string
  hasRunning: boolean
  isDark: boolean
  ghStatus: 'none' | 'ok' | 'error'
  onThemeToggle: () => void
  onMobileMenuToggle: () => void
}

export default function TopNavBar({
  jiraProjects,
  activeJiraProjectKey,
  activeGitHubProjectLabel,
  hasRunning,
  isDark,
  ghStatus,
  onThemeToggle,
  onMobileMenuToggle,
}: TopNavBarProps) {
  const user = useAppStore(s => s.user)
  const projects = useAppStore(s => s.projects)
  const logout = useAppStore(s => s.logout)
  const navigate = useNavigate()

  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const projectsRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const activeJiraProjectLabel =
    jiraProjects.find(p => p.key === activeJiraProjectKey)
      ? `${activeJiraProjectKey} - ${jiraProjects.find(p => p.key === activeJiraProjectKey)?.name}`
      : (activeJiraProjectKey || 'No Jira project')

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectsRef.current && !projectsRef.current.contains(e.target as Node)) {
        setProjectsDropdownOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="h-16 px-4 flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
          title="Toggle menu"
        >
          <Menu size={18} />
        </button>

        {/* Logo Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
            <Zap size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-gray-900 dark:text-white">ATM</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">TestManager</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 mx-4">
          {NAV.filter(item => canAccess(user?.role, item.to)).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={14} />
                  <span className="hidden xl:inline">{item.label}</span>
                  {item.to === '/runs' && hasRunning && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Project Selectors Dropdown */}
        <div ref={projectsRef} className="relative hidden md:block">
          <button
            onClick={() => setProjectsDropdownOpen(!projectsDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
          >
            <span className="text-xs">Projects</span>
            <ChevronDown size={14} className={`transition-transform ${projectsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {projectsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                  Active Jira Project
                </p>
                <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 truncate">
                  {activeJiraProjectLabel}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                  Active GitHub Project
                </p>
                <div className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 truncate">
                  {activeGitHubProjectLabel}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* GitHub Status Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400"
            title={
              ghStatus === 'ok' ? 'GitHub: Connected' :
              ghStatus === 'error' ? 'GitHub: Connection error' :
              'GitHub: Not connected'
            }
          >
            <Github size={12} className={
              ghStatus === 'ok' ? 'text-emerald-500' :
              ghStatus === 'error' ? 'text-red-500' :
              'text-gray-400'
            } />
            <span className={`h-1.5 w-1.5 rounded-full ${
              ghStatus === 'ok' ? 'bg-emerald-500' :
              ghStatus === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
            title="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Dropdown */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                {user?.full_name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <ChevronDown size={14} className={`text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-3 space-y-2">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.full_name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {ROLE_LABELS[user?.role as UserRole] ?? user?.role}
                  </p>
                </div>

                <NavLink
                  to="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <Settings size={14} />
                  Settings
                </NavLink>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
