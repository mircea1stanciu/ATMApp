import { useEffect, useState } from 'react'
import {
  AlertCircle, CheckCircle2, Github, Loader2,
  Save, Settings2, ShieldAlert, Unplug, Eye, EyeOff, Trash2,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { apiService } from '@/services/api'

interface GlobalSettings {
  github_token_set: boolean
  github_token_preview: string
  github_mcp_base_url: string
}

interface ProjectGithubSettings {
  github_token_set: boolean
  github_token_preview: string
  github_repo_url: string
}

interface TestResult {
  ok: boolean
  login?: string
  name?: string
  plan?: string
  error?: string
}

// ── Shared GitHub card used for both global and per-project ───────────────
interface GitHubCardProps {
  title: string
  subtitle: string
  tokenSet: boolean
  tokenPreview: string
  repoUrl: string
  loading: boolean
  saving: boolean
  testing: boolean
  error: string | null
  saveMsg: string | null
  testResult: TestResult | null
  canSave: boolean
  onTokenChange: (v: string) => void
  onRepoUrlChange: (v: string) => void
  onSave: () => void
  onTest: () => void
  onDisconnect?: () => void
  disconnecting?: boolean
}

function GitHubCard({
  title, subtitle, tokenSet, tokenPreview, repoUrl, loading,
  saving, testing, error, saveMsg, testResult, canSave,
  onTokenChange, onRepoUrlChange, onSave, onTest, onDisconnect, disconnecting,
}: GitHubCardProps) {
  const [token, setToken] = useState('')
  const [localRepo, setLocalRepo] = useState(repoUrl)
  const [showToken, setShowToken] = useState(false)

  useEffect(() => { setLocalRepo(repoUrl) }, [repoUrl])

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md overflow-hidden">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
          <Github size={20} className="text-white dark:text-gray-900" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {!loading && (
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            tokenSet
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tokenSet ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {tokenSet ? 'Connected' : 'Not connected'}
          </span>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {tokenSet && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  Token on file: <span className="font-mono font-semibold">{tokenPreview}</span>
                </span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Fine-grained Personal Access Token (PAT)
                <span className="ml-1 font-normal text-gray-400">(leave blank to keep existing)</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={e => { setToken(e.target.value); onTokenChange(e.target.value) }}
                  placeholder="ghp_••••••••••••••••••••••••••••••••••••••"
                  className="form-input w-full pr-10 font-mono text-sm"
                />
                <button type="button" onClick={() => setShowToken(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                Generate at{' '}
                <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">
                  github.com/settings/tokens?type=beta
                </a>
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Repository URL
              </label>
              <input
                type="text"
                value={localRepo}
                onChange={e => { setLocalRepo(e.target.value); onRepoUrlChange(e.target.value) }}
                placeholder="https://github.com/your-org/your-repo.git"
                className="form-input w-full font-mono text-sm"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            {saveMsg && !error && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} className="shrink-0" /> {saveMsg}
              </div>
            )}
            {testResult && (
              <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                testResult.ok
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              }`}>
                {testResult.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                <div>
                  {testResult.ok ? (
                    <>
                      <p className="font-semibold">Connection successful!</p>
                      <p className="text-xs mt-0.5 opacity-80">
                        Logged in as <span className="font-mono font-semibold">@{testResult.login}</span>
                        {testResult.name ? ` (${testResult.name})` : ''}
                        {testResult.plan ? ` · Plan: ${testResult.plan}` : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">Connection failed</p>
                      <p className="text-xs mt-0.5 opacity-80">{testResult.error}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button onClick={onSave} disabled={saving || !canSave} className="btn-primary gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
              <button
                onClick={onTest}
                disabled={testing || !tokenSet}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 transition"
              >
                {testing ? <Loader2 size={14} className="animate-spin" /> : <Unplug size={14} />} Test Connection
              </button>
              {onDisconnect && tokenSet && (
                <button
                  onClick={() => {
                    if (window.confirm('Remove the GitHub token? This will disconnect the repository.')) {
                      onDisconnect()
                    }
                  }}
                  disabled={disconnecting}
                  className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition ml-auto"
                >
                  {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Disconnect
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Per-project GitHub panel ──────────────────────────────────────────────
function ProjectGitHubPanel({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [settings, setSettings] = useState<ProjectGithubSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [pendingToken, setPendingToken] = useState('')
  const [pendingRepo, setPendingRepo] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiService.getProjectGithub(projectId)
      .then(d => { setSettings(d); setPendingRepo(d.github_repo_url) })
      .catch(e => setError(apiService.errorMessage(e)))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleSave = async () => {
    setSaving(true); setError(null); setSaveMsg(null); setTestResult(null)
    try {
      const payload: { github_token?: string; github_repo_url?: string } = {}
      if (pendingToken.trim()) payload.github_token = pendingToken.trim()
      if (pendingRepo.trim()) payload.github_repo_url = pendingRepo.trim()
      const d = await apiService.saveProjectGithub(projectId, payload)
      setSettings(d); setPendingToken(''); setSaveMsg('Saved successfully.')
    } catch (e) { setError(apiService.errorMessage(e)) }
    finally { setSaving(false) }
  }

  const handleTest = async () => {
    setTesting(true); setTestResult(null); setError(null)
    try { setTestResult(await apiService.testProjectGithub(projectId)) }
    catch (e) { setError(apiService.errorMessage(e)) }
    finally { setTesting(false) }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true); setError(null); setSaveMsg(null); setTestResult(null)
    try {
      await apiService.disconnectProjectGithub(projectId)
      setSettings(s => s ? { ...s, github_token_set: false, github_token_preview: '' } : s)
      setSaveMsg('GitHub connection removed.')
    } catch (e) { setError(apiService.errorMessage(e)) }
    finally { setDisconnecting(false) }
  }

  return (
    <GitHubCard
      title={`GitHub — ${projectName}`}
      subtitle="Per-project Fine-grained PAT for this repository"
      tokenSet={settings?.github_token_set ?? false}
      tokenPreview={settings?.github_token_preview ?? ''}
      repoUrl={settings?.github_repo_url ?? ''}
      loading={loading}
      saving={saving}
      testing={testing}
      error={error}
      saveMsg={saveMsg}
      testResult={testResult}
      canSave={!!pendingToken.trim() || pendingRepo !== (settings?.github_repo_url ?? '')}
      onTokenChange={setPendingToken}
      onRepoUrlChange={setPendingRepo}
      onSave={handleSave}
      onTest={handleTest}
      onDisconnect={handleDisconnect}
      disconnecting={disconnecting}
    />
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const user = useAppStore(s => s.user)
  const projects = useAppStore(s => s.projects)
  const selectedProjectId = useAppStore(s => s.selectedProjectId)

  // Global settings (admin only)
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null)
  const [loadingGlobal, setLoadingGlobal] = useState(true)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [testingGlobal, setTestingGlobal] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [globalSaveMsg, setGlobalSaveMsg] = useState<string | null>(null)
  const [globalTestResult, setGlobalTestResult] = useState<TestResult | null>(null)
  const [pendingGlobalToken, setPendingGlobalToken] = useState('')
  const [pendingGlobalRepo, setPendingGlobalRepo] = useState('')

  const isAdmin = user?.role === 'admin'
  const isLead = user?.role === 'automation_lead'

  useEffect(() => {
    if (isAdmin) {
      apiService.getSettings()
        .then(d => { setGlobalSettings(d); setPendingGlobalRepo(d.github_mcp_base_url || '') })
        .catch(e => setGlobalError(apiService.errorMessage(e)))
        .finally(() => setLoadingGlobal(false))
    }
  }, [isAdmin])

  if (!isAdmin && !isLead) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert size={40} className="text-red-400" />
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">Access Denied</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You don't have permission to view settings.</p>
        </div>
      </div>
    )
  }

  const handleGlobalSave = async () => {
    setSavingGlobal(true); setGlobalError(null); setGlobalSaveMsg(null); setGlobalTestResult(null)
    try {
      const payload: { github_token?: string; github_mcp_base_url?: string } = {}
      if (pendingGlobalToken.trim()) payload.github_token = pendingGlobalToken.trim()
      if (pendingGlobalRepo.trim()) payload.github_mcp_base_url = pendingGlobalRepo.trim()
      const d = await apiService.saveGithubSettings(payload)
      setGlobalSettings(d); setPendingGlobalToken(''); setGlobalSaveMsg('Settings saved.')
    } catch (e) { setGlobalError(apiService.errorMessage(e)) }
    finally { setSavingGlobal(false) }
  }

  const handleGlobalTest = async () => {
    setTestingGlobal(true); setGlobalTestResult(null); setGlobalError(null)
    try { setGlobalTestResult(await apiService.testGithubConnection()) }
    catch (e) { setGlobalError(apiService.errorMessage(e)) }
    finally { setTestingGlobal(false) }
  }

  // Which project to show per-project settings for
  const activeProject = projects.find(p => p.id === selectedProjectId) ?? projects[0]

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
          <Settings2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage integrations and GitHub connections</p>
        </div>
      </div>

      {/* Global section – admin only */}
      {isAdmin && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Global MCP Settings
          </h2>
          <GitHubCard
            title="GitHub (Global)"
            subtitle="Default token used system-wide when no project-level token is set."
            tokenSet={globalSettings?.github_token_set ?? false}
            tokenPreview={globalSettings?.github_token_preview ?? ''}
            repoUrl={globalSettings?.github_mcp_base_url ?? ''}
            loading={loadingGlobal}
            saving={savingGlobal}
            testing={testingGlobal}
            error={globalError}
            saveMsg={globalSaveMsg}
            testResult={globalTestResult}
            canSave={!!pendingGlobalToken.trim() || pendingGlobalRepo !== (globalSettings?.github_mcp_base_url ?? '')}
            onTokenChange={setPendingGlobalToken}
            onRepoUrlChange={setPendingGlobalRepo}
            onSave={handleGlobalSave}
            onTest={handleGlobalTest}
          />
        </section>
      )}

      {/* Per-project section – lead & admin */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Project GitHub Connection
        </h2>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No projects available. Create a project first.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Project tabs */}
            {projects.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => useAppStore.getState().setSelectedProjectId(p.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      (selectedProjectId ?? projects[0].id) === p.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {activeProject && (
              <ProjectGitHubPanel
                key={activeProject.id}
                projectId={activeProject.id}
                projectName={activeProject.name}
              />
            )}
          </div>
        )}
      </section>

      {/* Placeholder future integrations */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'GitLab', icon: '🦊' },
            { name: 'Bitbucket', icon: '🪣' },
            { name: 'Slack', icon: '💬' },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 opacity-60">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Coming soon</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
