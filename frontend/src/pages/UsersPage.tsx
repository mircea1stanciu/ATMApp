import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2, Edit2, Loader2, Search, Shield, UserCheck,
  UserCog, Users, X, Eye, AlertCircle,
} from 'lucide-react'
import { apiService } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import type { UserResponse, UserRole } from '@/types/domain'
import { ROLE_LABELS, ROLE_COLORS } from '@/types/domain'

const ALL_ROLES: UserRole[] = ['admin', 'automation_lead', 'automation_user', 'viewer']

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin: <Shield size={13} />,
  automation_lead: <UserCog size={13} />,
  automation_user: <UserCheck size={13} />,
  viewer: <Eye size={13} />,
}

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access — manage users, projects, runs and all settings',
  automation_lead: 'Configure projects, suites and schedulers; execute runs',
  automation_user: 'Execute test runs; read project and suite details',
  viewer: 'Read-only access to runs, results and analytics',
}

interface EditState {
  userId: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  password: string
  passwordConfirm: string
}

export default function UsersPage() {
  const currentUser = useAppStore(s => s.user)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editState, setEditState] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'admin'

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await apiService.listUsers()
      setUsers(data)
    } catch (e) {
      setError(apiService.errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchUsers() }, [])

  const openEdit = (u: UserResponse) => {
    setError(null)
    setEditState({
      userId: u.id,
      email: u.email,
      full_name: u.full_name || '',
      role: u.role as UserRole,
      is_active: u.is_active,
      password: '',
      passwordConfirm: '',
    })
  }

  const handleSave = async () => {
    if (!editState) return
    
    // Validate password confirmation
    if (editState.password && editState.password !== editState.passwordConfirm) {
      setError('Passwords do not match')
      return
    }
    
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        email: editState.email,
        full_name: editState.full_name || undefined,
        role: editState.role,
        is_active: editState.is_active,
      }
      if (editState.password) payload.password = editState.password
      await apiService.updateUser(editState.userId, payload)
      setSuccessId(editState.userId)
      setTimeout(() => setSuccessId(null), 2500)
      setEditState(null)
      await fetchUsers()
    } catch (e) {
      setError(apiService.errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Access Denied</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Only Admins can manage users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">

      {/* Edit modal */}
      <AnimatePresence>
        {editState && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditState(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Edit User</h2>
                <button onClick={() => setEditState(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <input className="form-input" type="email" value={editState.email}
                    onChange={e => setEditState(s => s ? { ...s, email: e.target.value } : s)} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                  <input className="form-input" value={editState.full_name}
                    onChange={e => setEditState(s => s ? { ...s, full_name: e.target.value } : s)} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Role</label>
                  <div className="space-y-2">
                    {ALL_ROLES.map(role => (
                      <label key={role}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                          editState.role === role
                            ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input type="radio" name="role" value={role} checked={editState.role === role}
                          onChange={() => setEditState(s => s ? { ...s, role } : s)}
                          className="mt-0.5 accent-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[role]}`}>
                              {ROLE_ICONS[role]} {ROLE_LABELS[role]}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{ROLE_DESCRIPTIONS[role]}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">New Password <span className="text-gray-400">(leave blank to keep current)</span></label>
                  <input className="form-input" type="password" placeholder="••••••••" value={editState.password}
                    onChange={e => setEditState(s => s ? { ...s, password: e.target.value } : s)} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Confirm Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={editState.passwordConfirm}
                    onChange={e => setEditState(s => s ? { ...s, passwordConfirm: e.target.value } : s)} />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 transition hover:border-blue-300 dark:hover:border-blue-500/50">
                  Account Active
                  <input type="checkbox" checked={editState.is_active}
                    onChange={e => setEditState(s => s ? { ...s, is_active: e.target.checked } : s)}
                    className="h-4 w-4 accent-blue-600" />
                </label>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={() => setEditState(null)} className="btn-ghost">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Manage roles and permissions for all users</p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin text-gray-400" />}
          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            {users.length} users
          </span>
        </div>
      </div>

      {/* Role legend */}
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
        {ALL_ROLES.map(role => (
          <div key={role} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[role]}`}>
                {ROLE_ICONS[role]} {ROLE_LABELS[role]}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        {/* Search bar */}
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="form-input !pl-8 !py-2"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
              <Users size={20} /> No users found
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filtered.map(u => {
                const role = u.role as UserRole
                const isMe = u.id === currentUser?.id
                return (
                  <div key={u.id}
                    className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-gray-50 dark:hover:bg-gray-700/20"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                      {(u.full_name?.[0] || u.email[0]).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {u.full_name || '—'}
                        </p>
                        {isMe && (
                          <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">You</span>
                        )}
                        {!u.is_active && (
                          <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">Inactive</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${ROLE_COLORS[role] ?? ''}`}>
                      {ROLE_ICONS[role]} {ROLE_LABELS[role] ?? role}
                    </span>

                    {/* Joined */}
                    <p className="hidden shrink-0 text-xs text-gray-400 dark:text-gray-500 md:block">
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>

                    {/* Success tick */}
                    {successId === u.id && (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => openEdit(u)}
                      className="btn-ghost !px-2.5 !py-1.5 shrink-0"
                      title="Edit user"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
