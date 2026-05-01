import { create } from 'zustand'
import { apiService, setAccessToken } from '@/services/api'
import type {
  Project,
  ProjectNotificationsConfig,
  TestResult,
  TestRun,
  TestRunDetails,
  TestSuite,
  UserResponse,
} from '@/types/domain'

// ─── Derived types ───────────────────────────────────────────────────────────

type CompareStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error' | 'skipped' | 'cancelled' | 'missing'

export interface RunComparisonItem {
  key: string
  testName: string
  className: string | null
  statusA: CompareStatus
  statusB: CompareStatus
  kind: 'regression' | 'fix' | 'changed' | 'added' | 'removed' | 'unchanged'
}

export interface RunComparisonSummary {
  totalCompared: number
  changed: number
  regressions: number
  fixes: number
  added: number
  removed: number
}

export interface FlakyTestInsight {
  key: string
  testName: string
  className: string | null
  executions: number
  passed: number
  failed: number
  instability: number
}

export interface NotificationsFormState {
  emailEnabled: boolean
  emailRecipients: string
  notifyOnFailed: boolean
  notifyOnError: boolean
  slackEnabled: boolean
  slackWebhookUrl: string
}

// ─── Store shape ─────────────────────────────────────────────────────────────

interface AppState {
  // Auth
  token: string | null
  user: UserResponse | null
  loading: boolean
  error: string | null

  // Data
  projects: Project[]
  selectedProjectId: string | null
  suites: TestSuite[]
  selectedSuiteId: string | null
  branches: string[]
  runs: TestRun[]
  selectedRunId: string | null
  selectedRunDetails: TestRunDetails | null
  runDetailsLoading: boolean
  expandedResultId: string | null
  runBranch: string

  // Forms
  projectForm: { name: string; git_repo_url: string; description: string; default_branch: string; framework: string }
  suiteForm: { name: string; tags: string }
  notificationsForm: NotificationsFormState
  savingNotifications: boolean
  schedulerDrafts: Record<string, { cronExpression: string; active: boolean }>
  savingSchedulerSuiteId: string | null

  // Analytics
  flakyTests: FlakyTestInsight[]
  flakyLoading: boolean
  compareRunAId: string | null
  compareRunBId: string | null
  compareLoading: boolean
  runComparisonSummary: RunComparisonSummary | null
  runComparisonItems: RunComparisonItem[]

  // Actions
  authenticate: (token: string) => void
  logout: () => void
  setError: (error: string | null) => void
  setSelectedProjectId: (id: string | null) => void
  setSelectedSuiteId: (id: string | null) => void
  setSelectedRunId: (id: string | null) => void
  setExpandedResultId: (id: string | null) => void
  setRunBranch: (branch: string) => void
  setProjectForm: (fn: (prev: AppState['projectForm']) => AppState['projectForm']) => void
  setSuiteForm: (fn: (prev: AppState['suiteForm']) => AppState['suiteForm']) => void
  setNotificationsForm: (fn: (prev: NotificationsFormState) => NotificationsFormState) => void
  setSchedulerDrafts: (fn: (prev: AppState['schedulerDrafts']) => AppState['schedulerDrafts']) => void
  setCompareRunAId: (id: string | null) => void
  setCompareRunBId: (id: string | null) => void

  // Async actions
  loadInitialData: () => Promise<void>
  loadProjectData: (projectId: string) => Promise<void>
  refreshProjectData: (projectId: string) => Promise<void>
  loadRunDetails: (runId: string) => Promise<void>
  createProject: () => Promise<void>
  createSuite: () => Promise<void>
  createRun: () => Promise<void>
  executeRun: () => Promise<void>
  saveScheduler: (suiteId: string) => Promise<void>
  saveNotifications: () => Promise<void>
  computeFlakyTests: () => Promise<void>
  loadComparison: () => Promise<void>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readProjectNotificationsConfig(project: Project | null): NotificationsFormState {
  const n = (project?.config_json?.notifications || {}) as ProjectNotificationsConfig
  return {
    emailEnabled: Boolean(n.email_enabled),
    emailRecipients: Array.isArray(n.email_recipients) ? n.email_recipients.join(', ') : '',
    notifyOnFailed: n.notify_on_failed !== false,
    notifyOnError: n.notify_on_error !== false,
    slackEnabled: Boolean(n.slack_enabled),
    slackWebhookUrl: typeof n.slack_webhook_url === 'string' ? n.slack_webhook_url : '',
  }
}

function buildRunComparison(resultsA: TestResult[], resultsB: TestResult[]) {
  const mapA = new Map<string, TestResult>()
  const mapB = new Map<string, TestResult>()
  for (const r of resultsA) mapA.set(`${r.class_name || '__'}::${r.test_name}`, r)
  for (const r of resultsB) mapB.set(`${r.class_name || '__'}::${r.test_name}`, r)

  const allKeys = new Set([...mapA.keys(), ...mapB.keys()])
  const items: RunComparisonItem[] = []

  for (const key of allKeys) {
    const a = mapA.get(key)
    const b = mapB.get(key)
    const statusA: CompareStatus = a?.status || 'missing'
    const statusB: CompareStatus = b?.status || 'missing'
    let kind: RunComparisonItem['kind'] = 'unchanged'
    if (!a && b) kind = 'added'
    else if (a && !b) kind = 'removed'
    else if (statusA === 'passed' && (statusB === 'failed' || statusB === 'error')) kind = 'regression'
    else if ((statusA === 'failed' || statusA === 'error') && statusB === 'passed') kind = 'fix'
    else if (statusA !== statusB) kind = 'changed'
    items.push({ key, testName: b?.test_name || a?.test_name || 'unknown', className: b?.class_name || a?.class_name || null, statusA, statusB, kind })
  }

  const changed = items.filter(i => i.kind !== 'unchanged')
  const summary: RunComparisonSummary = {
    totalCompared: items.length,
    changed: changed.length,
    regressions: changed.filter(i => i.kind === 'regression').length,
    fixes: changed.filter(i => i.kind === 'fix').length,
    added: changed.filter(i => i.kind === 'added').length,
    removed: changed.filter(i => i.kind === 'removed').length,
  }
  const priority: Record<RunComparisonItem['kind'], number> = { regression: 0, fix: 1, changed: 2, added: 3, removed: 4, unchanged: 5 }
  const changedItems = [...changed].sort((a, b) => priority[a.kind] - priority[b.kind] || a.testName.localeCompare(b.testName))
  return { summary, changedItems }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  token: localStorage.getItem('tm_access_token'),
  user: null,
  loading: false,
  error: null,

  // Data
  projects: [],
  selectedProjectId: null,
  suites: [],
  selectedSuiteId: null,
  branches: [],
  runs: [],
  selectedRunId: null,
  selectedRunDetails: null,
  runDetailsLoading: false,
  expandedResultId: null,
  runBranch: 'main',

  // Forms
  projectForm: { name: '', git_repo_url: '', description: '', default_branch: 'main', framework: 'pytest' },
  suiteForm: { name: '', tags: '' },
  notificationsForm: { emailEnabled: false, emailRecipients: '', notifyOnFailed: true, notifyOnError: true, slackEnabled: false, slackWebhookUrl: '' },
  savingNotifications: false,
  schedulerDrafts: {},
  savingSchedulerSuiteId: null,

  // Analytics
  flakyTests: [],
  flakyLoading: false,
  compareRunAId: null,
  compareRunBId: null,
  compareLoading: false,
  runComparisonSummary: null,
  runComparisonItems: [],

  // Simple setters
  setError: (error) => set({ error }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedSuiteId: (id) => set({ selectedSuiteId: id }),
  setSelectedRunId: (id) => set({ selectedRunId: id, expandedResultId: null }),
  setExpandedResultId: (id) => set({ expandedResultId: id }),
  setRunBranch: (branch) => set({ runBranch: branch }),
  setProjectForm: (fn) => set(s => ({ projectForm: fn(s.projectForm) })),
  setSuiteForm: (fn) => set(s => ({ suiteForm: fn(s.suiteForm) })),
  setNotificationsForm: (fn) => set(s => ({ notificationsForm: fn(s.notificationsForm) })),
  setSchedulerDrafts: (fn) => set(s => ({ schedulerDrafts: fn(s.schedulerDrafts) })),
  setCompareRunAId: (id) => set({ compareRunAId: id }),
  setCompareRunBId: (id) => set({ compareRunBId: id }),

  authenticate: (token) => {
    localStorage.setItem('tm_access_token', token)
    setAccessToken(token)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('tm_access_token')
    setAccessToken(null)
    set({
      token: null, user: null, projects: [], suites: [], runs: [],
      selectedProjectId: null, selectedSuiteId: null, selectedRunId: null,
      selectedRunDetails: null,
    })
  },

  loadInitialData: async () => {
    const { token } = get()
    if (!token) return
    setAccessToken(token)
    set({ loading: true, error: null })
    try {
      const [u, ps] = await Promise.all([apiService.me(), apiService.listProjects()])
      set({ user: u, projects: ps })
      if (ps.length > 0 && !get().selectedProjectId) {
        set({ selectedProjectId: ps[0].id })
      }
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    } finally {
      set({ loading: false })
    }
  },

  loadProjectData: async (projectId) => {
    const { token } = get()
    if (!token) return
    try {
      const [ss, rs, bs] = await Promise.all([
        apiService.listSuites(projectId),
        apiService.listRunsByProject(projectId),
        apiService.listBranches(projectId),
      ])
      set({ suites: ss, runs: rs, branches: bs.map(b => b.name) })
      if (ss.length > 0) set(s => ({ selectedSuiteId: s.selectedSuiteId || ss[0].id }))
      if (rs.length === 0) {
        set({ selectedRunId: null, selectedRunDetails: null })
      } else {
        set(s => ({ selectedRunId: (s.selectedRunId && rs.some(r => r.id === s.selectedRunId)) ? s.selectedRunId : rs[0].id }))
      }
      // Init scheduler drafts
      set(prev => {
        const next = { ...prev.schedulerDrafts }
        for (const s of ss) {
          if (!next[s.id]) next[s.id] = { cronExpression: s.cron_expression || '', active: s.active }
        }
        return { schedulerDrafts: next }
      })
      // Set notifications form for selected project
      const project = get().projects.find(p => p.id === projectId) || null
      set({ notificationsForm: readProjectNotificationsConfig(project) })
      // Init comparison run IDs
      const sorted = [...rs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      if (sorted.length > 0) {
        set(s => ({
          compareRunAId: s.compareRunAId || sorted[0].id,
          compareRunBId: s.compareRunBId || sorted[1]?.id || sorted[0].id,
        }))
      }
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    }
  },

  refreshProjectData: async (projectId) => {
    const [ss, rs] = await Promise.all([apiService.listSuites(projectId), apiService.listRunsByProject(projectId)])
    set({ suites: ss, runs: rs })
    if (ss.length > 0) set({ selectedSuiteId: ss[0].id })
    if (rs.length === 0) { set({ selectedRunId: null, selectedRunDetails: null }); return }
    set(s => ({ selectedRunId: (s.selectedRunId && rs.some(r => r.id === s.selectedRunId)) ? s.selectedRunId : rs[0].id }))
  },

  loadRunDetails: async (runId) => {
    set({ runDetailsLoading: true, expandedResultId: null })
    try {
      const d = await apiService.getRunDetails(runId)
      set(s => ({
        selectedRunDetails: d,
        runs: s.runs.map(r => r.id === d.id ? {
          ...r, status: d.status, started_at: d.started_at, finished_at: d.finished_at,
          total_tests: d.total_tests, passed_tests: d.passed_tests,
          failed_tests: d.failed_tests, skipped_tests: d.skipped_tests,
        } : r),
      }))
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    } finally {
      set({ runDetailsLoading: false })
    }
  },

  createProject: async () => {
    const { projectForm } = get()
    set({ error: null })
    try {
      const p = await apiService.createProject(projectForm)
      set(s => ({
        projects: [p, ...s.projects],
        selectedProjectId: p.id,
        projectForm: { name: '', git_repo_url: '', description: '', default_branch: 'main', framework: 'pytest' },
      }))
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    }
  },

  createSuite: async () => {
    const { selectedProjectId, suiteForm } = get()
    if (!selectedProjectId) return
    try {
      const tags = suiteForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      const s = await apiService.createSuite(selectedProjectId, { name: suiteForm.name, tags })
      set(prev => ({
        suites: [s, ...prev.suites],
        selectedSuiteId: s.id,
        suiteForm: { name: '', tags: '' },
      }))
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    }
  },

  createRun: async () => {
    const { selectedSuiteId, user, runBranch, projects, selectedProjectId } = get()
    if (!selectedSuiteId || !user?.email) {
      set({ error: 'Selectează o suită și asigură-te că ești autentificat.' })
      return
    }
    const project = projects.find(p => p.id === selectedProjectId)
    try {
      const r = await apiService.createRun({
        suite_id: selectedSuiteId,
        branch: runBranch || project?.default_branch || 'main',
        triggered_by: user.email,
      })
      set(s => ({ runs: [r, ...s.runs], selectedRunId: r.id }))
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    }
  },

  executeRun: async () => {
    const { selectedRunId, selectedProjectId } = get()
    if (!selectedRunId || !selectedProjectId) return
    try {
      await apiService.executeRun(selectedRunId)
      await get().refreshProjectData(selectedProjectId)
      const d = await apiService.getRunDetails(selectedRunId)
      set({ selectedRunDetails: d })
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    }
  },

  saveScheduler: async (suiteId) => {
    const { schedulerDrafts } = get()
    const draft = schedulerDrafts[suiteId]
    if (!draft) return
    try {
      set({ savingSchedulerSuiteId: suiteId, error: null })
      const updated = await apiService.updateSuite(suiteId, {
        cron_expression: draft.cronExpression.trim() || null,
        active: draft.active,
      })
      set(s => ({
        suites: s.suites.map(suite => suite.id === suiteId ? updated : suite),
        schedulerDrafts: { ...s.schedulerDrafts, [suiteId]: { cronExpression: updated.cron_expression || '', active: updated.active } },
      }))
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    } finally {
      set({ savingSchedulerSuiteId: null })
    }
  },

  saveNotifications: async () => {
    const { selectedProjectId, projects, notificationsForm } = get()
    const project = projects.find(p => p.id === selectedProjectId)
    if (!project) return
    try {
      set({ savingNotifications: true, error: null })
      const payload: ProjectNotificationsConfig = {
        email_enabled: notificationsForm.emailEnabled,
        email_recipients: notificationsForm.emailRecipients.split(',').map(v => v.trim()).filter(Boolean),
        notify_on_failed: notificationsForm.notifyOnFailed,
        notify_on_error: notificationsForm.notifyOnError,
        slack_enabled: notificationsForm.slackEnabled,
        slack_webhook_url: notificationsForm.slackWebhookUrl.trim(),
      }
      const updated = await apiService.updateProject(project.id, {
        config_json: { ...(project.config_json || {}), notifications: payload },
      })
      set(s => ({
        projects: s.projects.map(p => p.id === updated.id ? updated : p),
        notificationsForm: readProjectNotificationsConfig(updated),
      }))
    } catch (e) {
      set({ error: apiService.errorMessage(e) })
    } finally {
      set({ savingNotifications: false })
    }
  },

  computeFlakyTests: async () => {
    const { runs } = get()
    if (runs.length === 0) { set({ flakyTests: [] }); return }
    set({ flakyLoading: true })
    try {
      const recent = [...runs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20)
      const results = await Promise.allSettled(recent.map(r => apiService.getRunDetails(r.id)))
      const agg = new Map<string, FlakyTestInsight>()
      for (const res of results) {
        if (res.status !== 'fulfilled') continue
        for (const tr of res.value.results) {
          const key = `${tr.class_name || '__'}::${tr.test_name}`
          const ex = agg.get(key) || { key, testName: tr.test_name, className: tr.class_name, executions: 0, passed: 0, failed: 0, instability: 0 }
          ex.executions++
          if (tr.status === 'passed') ex.passed++
          if (tr.status === 'failed' || tr.status === 'error') ex.failed++
          agg.set(key, ex)
        }
      }
      const computed = Array.from(agg.values())
        .filter(i => i.passed > 0 && i.failed > 0)
        .map(i => ({ ...i, instability: Number(((Math.min(i.passed, i.failed) / (i.passed + i.failed)) * 100).toFixed(2)) }))
        .sort((a, b) => b.instability - a.instability || b.executions - a.executions)
        .slice(0, 8)
      set({ flakyTests: computed })
    } finally {
      set({ flakyLoading: false })
    }
  },

  loadComparison: async () => {
    const { compareRunAId, compareRunBId } = get()
    if (!compareRunAId || !compareRunBId || compareRunAId === compareRunBId) {
      set({ runComparisonSummary: null, runComparisonItems: [] })
      return
    }
    set({ compareLoading: true })
    try {
      const [a, b] = await Promise.all([apiService.getRunDetails(compareRunAId), apiService.getRunDetails(compareRunBId)])
      const cmp = buildRunComparison(a.results, b.results)
      set({ runComparisonSummary: cmp.summary, runComparisonItems: cmp.changedItems })
    } catch (e) {
      set({ error: apiService.errorMessage(e), runComparisonSummary: null, runComparisonItems: [] })
    } finally {
      set({ compareLoading: false })
    }
  },
}))
