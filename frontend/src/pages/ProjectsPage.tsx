import { FormEvent, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell, CheckCircle2, FolderGit2, Info, Loader2, Plus, X,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

type RightTab = 'details' | 'notifications'

export default function ProjectsPage() {
  const projects = useAppStore(s => s.projects)
  const selectedProjectId = useAppStore(s => s.selectedProjectId)
  const setSelectedProjectId = useAppStore(s => s.setSelectedProjectId)
  const projectForm = useAppStore(s => s.projectForm)
  const setProjectForm = useAppStore(s => s.setProjectForm)
  const createProject = useAppStore(s => s.createProject)
  const notificationsForm = useAppStore(s => s.notificationsForm)
  const setNotificationsForm = useAppStore(s => s.setNotificationsForm)
  const saveNotifications = useAppStore(s => s.saveNotifications)
  const savingNotifications = useAppStore(s => s.savingNotifications)
  const error = useAppStore(s => s.error)

  const [showCreate, setShowCreate] = useState(false)
  const [rightTab, setRightTab] = useState<RightTab>('details')

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault()
    await createProject()
    setShowCreate(false)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111118] p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Proiect nou</h2>
                <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-slate-500 hover:text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Nume proiect</label>
                  <input className="form-input" placeholder="My Test Suite" value={projectForm.name}
                    onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Repository URL</label>
                  <input className="form-input" placeholder="https://github.com/org/repo" value={projectForm.git_repo_url}
                    onChange={e => setProjectForm(p => ({ ...p, git_repo_url: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Branch</label>
                    <input className="form-input" placeholder="main" value={projectForm.default_branch}
                      onChange={e => setProjectForm(p => ({ ...p, default_branch: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Framework</label>
                    <select className="form-input" value={projectForm.framework}
                      onChange={e => setProjectForm(p => ({ ...p, framework: e.target.value }))}>
                      <option value="pytest">pytest</option>
                      <option value="playwright">playwright</option>
                      <option value="cypress">cypress</option>
                      <option value="robot">robot</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Descriere</label>
                  <textarea className="form-input" placeholder="Opțional..." value={projectForm.description}
                    onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Anulează</button>
                  <button type="submit" className="btn-primary"><Plus size={15} /> Adaugă</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main grid: left list + right details */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[340px_1fr]">
        {/* Left: project list */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] px-4 py-3">
            <h3 className="text-sm font-semibold text-white">
              Proiecte <span className="text-slate-500">({projects.length})</span>
            </h3>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-2.5 py-1.5 text-xs">
              <Plus size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <FolderGit2 size={24} className="mb-2 text-slate-700" />
                <p className="text-sm text-slate-500">Niciun proiect</p>
                <button onClick={() => setShowCreate(true)} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">Adaugă →</button>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03] p-1">
                {projects.map(project => {
                  const isSelected = selectedProjectId === project.id
                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/[0.06] ring-1 ring-cyan-500/20'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? 'bg-cyan-500/15 text-cyan-400' : 'bg-white/[0.04] text-slate-500'
                      }`}>
                        <FolderGit2 size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{project.name}</p>
                          {isSelected && <CheckCircle2 size={12} className="shrink-0 text-cyan-400" />}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{project.git_repo_url}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-400">{project.framework || '?'}</span>
                          <span className="text-[10px] text-slate-600">{project.default_branch}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: details / notifications */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {/* Right tabs */}
          <div className="flex shrink-0 items-center gap-1 border-b border-white/[0.04] px-4 py-2">
            {([
              { id: 'details' as RightTab, label: 'Detalii', icon: Info },
              { id: 'notifications' as RightTab, label: 'Notificări', icon: Bell },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setRightTab(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  rightTab === t.id ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {!selectedProject ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <FolderGit2 size={28} className="mb-2 text-slate-700" />
                <p className="text-sm text-slate-500">Selectează un proiect din stânga</p>
              </div>
            ) : rightTab === 'details' ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedProject.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedProject.description || 'Fără descriere'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Provider', value: selectedProject.git_provider },
                    { label: 'Branch', value: selectedProject.default_branch },
                    { label: 'Framework', value: selectedProject.framework || 'unknown' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                      <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                      <p className="mt-1 text-sm font-medium text-slate-200">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-[11px] font-medium text-slate-500">Repository</p>
                  <p className="mt-1 truncate text-sm text-slate-300">{selectedProject.git_repo_url}</p>
                </div>
              </div>
            ) : (
              /* Notifications tab */
              <div className="space-y-3">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-white">Notificări — {selectedProject.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Alerte email și Slack la eșec</p>
                </div>
                {([
                  { label: 'Email activ', key: 'emailEnabled' as const },
                  { label: 'Notifică la eșec', key: 'notifyOnFailed' as const },
                  { label: 'Notifică la eroare', key: 'notifyOnError' as const },
                  { label: 'Slack activ', key: 'slackEnabled' as const },
                ] as const).map(({ label, key }) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/[0.08]">
                    {label}
                    <input type="checkbox" checked={notificationsForm[key]} onChange={e => setNotificationsForm(p => ({ ...p, [key]: e.target.checked }))}
                      className="h-4 w-4 accent-cyan-400" />
                  </label>
                ))}
                {notificationsForm.emailEnabled && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Destinatari</label>
                    <input className="form-input" placeholder="email1@x.com, email2@x.com"
                      value={notificationsForm.emailRecipients}
                      onChange={e => setNotificationsForm(p => ({ ...p, emailRecipients: e.target.value }))} />
                  </div>
                )}
                {notificationsForm.slackEnabled && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Slack Webhook</label>
                    <input className="form-input" placeholder="https://hooks.slack.com/services/..."
                      value={notificationsForm.slackWebhookUrl}
                      onChange={e => setNotificationsForm(p => ({ ...p, slackWebhookUrl: e.target.value }))} />
                  </div>
                )}
                <button onClick={() => void saveNotifications()} disabled={savingNotifications} className="btn-primary w-full py-2.5 mt-2">
                  {savingNotifications && <Loader2 size={14} className="animate-spin" />}
                  {savingNotifications ? 'Se salvează...' : 'Salvează'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
