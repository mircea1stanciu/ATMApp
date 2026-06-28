import { useEffect, useMemo, useState } from 'react'
import {
  BarChart2, Download, GitBranch, Loader2,
  PlayCircle, Terminal, Trash2, XCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useRunWebSocket } from '@/hooks/useRunWebSocket'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { apiService } from '@/services/api'
import type { GitHubTreeItem } from '@/types/domain'

type RightPanel = 'logs' | 'results'
type LogView = 'cli' | 'structured'

const LOG_VIEW_STORAGE_KEY = 'runs.logView'

function formatDuration(durationMs: number | null): string {
  if (durationMs == null || Number.isNaN(durationMs)) return '-'
  if (durationMs < 1000) return `${Math.round(durationMs)} ms`
  return `${(durationMs / 1000).toFixed(2)} s`
}

function escapeCsvValue(value: unknown): string {
  const text = value == null ? '' : String(value)
  const escaped = text.replace(/"/g, '""')
  if (/[",\n]/.test(escaped)) return `"${escaped}"`
  return escaped
}

function formatCollectionLabel(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 1) return path
  return parts.slice(1).join('/')
}

export default function RunsPage() {
  const selectedProjectId = useAppStore(s => s.selectedProjectId)
  const selectedSuiteId = useAppStore(s => s.selectedSuiteId)
  const runs = useAppStore(s => s.runs)
  const selectedRunId = useAppStore(s => s.selectedRunId)
  const setSelectedRunId = useAppStore(s => s.setSelectedRunId)
  const selectedRunDetails = useAppStore(s => s.selectedRunDetails)
  const runDetailsLoading = useAppStore(s => s.runDetailsLoading)
  const expandedResultId = useAppStore(s => s.expandedResultId)
  const setExpandedResultId = useAppStore(s => s.setExpandedResultId)
  const runProject = useAppStore(s => s.runProject)
  const setRunProject = useAppStore(s => s.setRunProject)
  const detectedProjects = useAppStore(s => s.detectedProjects)
  const projectCollections = useAppStore(s => s.projectCollections)
  const collectionEnvironments = useAppStore(s => s.collectionEnvironments)
  const runCollection = useAppStore(s => s.runCollection)
  const setRunCollection = useAppStore(s => s.setRunCollection)
  const runEnvironment = useAppStore(s => s.runEnvironment)
  const setRunEnvironment = useAppStore(s => s.setRunEnvironment)
  const collections = useAppStore(s => s.collections)
  const createRun = useAppStore(s => s.createRun)
  const executeRun = useAppStore(s => s.executeRun)
  const loadRunDetails = useAppStore(s => s.loadRunDetails)
  const loadProjectData = useAppStore(s => s.loadProjectData)
  const cancelRun = useAppStore(s => s.cancelRun)
  const deleteRun = useAppStore(s => s.deleteRun)
  const user = useAppStore(s => s.user)
  const canExecute = user?.role !== 'viewer'

  const [rightPanel, setRightPanel] = useState<RightPanel>('logs')
  const [logView, setLogView] = useState<LogView>(() => {
    if (typeof window === 'undefined') return 'cli'
    const saved = window.localStorage.getItem(LOG_VIEW_STORAGE_KEY)
    return saved === 'structured' ? 'structured' : 'cli'
  })
  const [exportingPdf, setExportingPdf] = useState(false)
  const [repoEnvironments, setRepoEnvironments] = useState<string[]>([])
  const [repoEnvironmentsResolved, setRepoEnvironmentsResolved] = useState(false)

  const { cliText, structuredText, connected, connectionError, clearMessages } = useRunWebSocket({
    runId: selectedRunId,
    enabled: Boolean(selectedRunId),
  })

  useEffect(() => {
    if (selectedProjectId) void loadProjectData(selectedProjectId)
  }, [selectedProjectId, loadProjectData])

  useEffect(() => {
    if (selectedRunId) void loadRunDetails(selectedRunId)
  }, [selectedRunId, loadRunDetails])

  useEffect(() => {
    const state = useAppStore.getState()
    const run = state.runs.find(r => r.id === selectedRunId)
    if (run?.status !== 'running') return
    const iv = setInterval(() => void loadRunDetails(selectedRunId!), 5000)
    return () => clearInterval(iv)
  }, [selectedRunId, loadRunDetails])

  const runsByNewest = useMemo(() =>
    [...runs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [runs])

  const filteredCollections = useMemo(
    () => (runProject ? (projectCollections[runProject] || []) : collections),
    [runProject, projectCollections, collections],
  )
  const filteredEnvironments = useMemo(() => {
    if (repoEnvironmentsResolved) return repoEnvironments
    return runCollection ? (collectionEnvironments[runCollection] || []) : []
  }, [repoEnvironmentsResolved, repoEnvironments, runCollection, collectionEnvironments])

  useEffect(() => {
    if (!runProject) return
    if (runCollection && filteredCollections.includes(runCollection)) return
    setRunCollection(filteredCollections[0] || '')
  }, [runProject, runCollection, filteredCollections, setRunCollection])

  useEffect(() => {
    let cancelled = false

    const loadBruEnvironments = async () => {
      if (!selectedProjectId || !runCollection) {
        setRepoEnvironments([])
        setRepoEnvironmentsResolved(false)
        return
      }

      const candidatePaths = [
        `${runCollection}/environments`,
        `${runCollection}/environment`,
      ]

      let items: GitHubTreeItem[] = []
      let resolved = false

      for (const envPath of candidatePaths) {
        try {
          const response = await apiService.getProjectRepoTree(selectedProjectId, envPath)
          items = response
          resolved = true
          break
        } catch {
          // Try next candidate path.
        }
      }

      if (cancelled) return

      if (!resolved) {
        setRepoEnvironments([])
        setRepoEnvironmentsResolved(false)
        return
      }

      const bruEnvironments = items
        .filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.bru'))
        .map(item => item.name.replace(/\.bru$/i, ''))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))

      setRepoEnvironments([...new Set(bruEnvironments)])
      setRepoEnvironmentsResolved(true)
    }

    void loadBruEnvironments()

    return () => {
      cancelled = true
    }
  }, [selectedProjectId, runCollection])

  useEffect(() => {
    if (runEnvironment && filteredEnvironments.includes(runEnvironment)) return
    setRunEnvironment(filteredEnvironments[0] || '')
  }, [runEnvironment, filteredEnvironments, setRunEnvironment])

  useEffect(() => {
    window.localStorage.setItem(LOG_VIEW_STORAGE_KEY, logView)
  }, [logView])

  const handleExportCsv = () => {
    if (!selectedRunDetails) return
    const headers = ['run_id', 'test_id', 'test_name', 'class_name', 'status', 'duration_ms', 'error_message', 'stack_trace']
    const rows = selectedRunDetails.results.map(r => [selectedRunDetails.id, r.id, r.test_name, r.class_name || '', r.status, r.duration_ms ?? '', r.error_message || '', r.stack_trace || ''])
    const csv = [headers, ...rows].map(row => row.map(v => escapeCsvValue(v)).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `run-${selectedRunDetails.id.slice(0, 8)}-results.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = async () => {
    if (!selectedRunDetails) return
    setExportingPdf(true)
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      doc.setFontSize(14)
      doc.text('Automation Test Manager - Run Report', 40, 40)
      doc.setFontSize(10)
      doc.text(`Run ID: ${selectedRunDetails.id}`, 40, 60)
      doc.text(`Status: ${selectedRunDetails.status}`, 40, 74)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 88)
      doc.text(`Total: ${selectedRunDetails.total_tests} | Passed: ${selectedRunDetails.passed_tests} | Failed: ${selectedRunDetails.failed_tests} | Skipped: ${selectedRunDetails.skipped_tests}`, 40, 102)
      autoTable(doc, {
        startY: 120,
        head: [['Test Name', 'Class', 'Status', 'Duration (ms)', 'Error']],
        body: selectedRunDetails.results.map(r => [r.test_name, r.class_name || '-', r.status, r.duration_ms == null ? '-' : String(r.duration_ms), r.error_message || '-']),
        styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
        headStyles: { fillColor: [15, 23, 42] },
        columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 140 }, 2: { cellWidth: 70 }, 3: { cellWidth: 85 }, 4: { cellWidth: 290 } },
      })
      doc.save(`run-${selectedRunDetails.id.slice(0, 8)}-report.pdf`)
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="flex h-full gap-3">
      {/* ── Col 1: Project Runs list ── */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
            Project Runs <span className="text-gray-400 dark:text-gray-500">({runs.length})</span>
          </h3>
        </div>
        {/* Create run */}
        {canExecute && (
        <div className="shrink-0 space-y-1.5 border-b border-gray-200 dark:border-gray-700 p-2">
          <select
            value={runProject}
            onChange={e => setRunProject(e.target.value)}
            className="form-input !py-1.5 !px-2 !text-xs w-full"
          >
            {detectedProjects.length === 0 && <option value="">No projects detected</option>}
            {detectedProjects.map(project => <option key={project} value={project}>{project}</option>)}
          </select>
          <select value={runCollection} onChange={e => setRunCollection(e.target.value)} className="form-input !py-1.5 !px-2 !text-xs w-full">
            {filteredCollections.length === 0 && <option value="">No collections</option>}
            {filteredCollections.map(c => <option key={c} value={c}>{formatCollectionLabel(c)}</option>)}
          </select>
          <select value={runEnvironment} onChange={e => setRunEnvironment(e.target.value)} className="form-input !py-1.5 !px-2 !text-xs w-full">
            {filteredEnvironments.length === 0 && <option value="">No environments</option>}
            {filteredEnvironments.map(env => <option key={env} value={env}>{env}</option>)}
          </select>
          <button onClick={() => void createRun()} disabled={!selectedProjectId || !runCollection} className="btn-primary !px-2 !py-1.5 text-xs w-full justify-center">
            <PlayCircle size={12} /> Run
          </button>
        </div>
        )}
        {/* Execute button */}
        {canExecute && (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {selectedRunId ? `Selected: ${selectedRunId.slice(0, 8)}` : 'Select a run'}
          </span>
          <button onClick={() => void executeRun()} disabled={!selectedRunId} className="btn-primary !px-2.5 !py-1 text-[10px]">
            <PlayCircle size={11} /> Execute
          </button>
        </div>
        )}
        {/* Runs list */}
        <div className="flex-1 overflow-y-auto">
          {runs.length === 0 && <p className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">Create a run to get started.</p>}
          {runsByNewest.map(run => (
            <div
              key={run.id}
              className={`group flex w-full items-center border-b border-gray-100 dark:border-gray-700/50 transition ${
                selectedRunId === run.id
                  ? 'bg-blue-50 dark:bg-blue-500/10'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
            >
              <button
                onClick={() => setSelectedRunId(run.id)}
                className="flex flex-1 items-center justify-between px-3 py-2.5 text-left min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">{run.id.slice(0, 8)}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                      <GitBranch size={9} />{run.branch || 'main'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{run.passed_tests}/{run.total_tests} passed</span>
                </div>
                <StatusBadge status={run.status} />
              </button>
              {/* Cancel / Delete actions */}
              {canExecute && (
                <div className="flex shrink-0 items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(run.status === 'running' || run.status === 'pending') && (
                    <button
                      title="Cancel run"
                      onClick={e => { e.stopPropagation(); void cancelRun(run.id) }}
                      className="rounded p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600"
                    >
                      <XCircle size={13} />
                    </button>
                  )}
                  <button
                    title="Delete run"
                    onClick={e => { e.stopPropagation(); void deleteRun(run.id) }}
                    className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Col 2: Logs / Results ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        {/* Panel tabs */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setRightPanel('logs')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                rightPanel === 'logs'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}>
              <Terminal size={12} /> Live Logs
            </button>
            <button onClick={() => setRightPanel('results')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                rightPanel === 'results'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}>
              <BarChart2 size={12} /> Results
            </button>
          </div>
          <div className="flex items-center gap-2">
            {rightPanel === 'logs' && (
              <>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-0.5">
                  <button
                    onClick={() => setLogView('cli')}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                      logView === 'cli'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    Raw CLI
                  </button>
                  <button
                    onClick={() => setLogView('structured')}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition ${
                      logView === 'structured'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    Structured
                  </button>
                </div>
                <span className={`flex items-center gap-1 text-[10px] ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                  {connected ? 'Live' : 'Off'}
                </span>
                <button onClick={clearMessages} className="btn-ghost !px-2 !py-1 !text-[10px]">Clear</button>
              </>
            )}
            {rightPanel === 'results' && (
              <>
                <button onClick={() => void handleExportPdf()}
                  disabled={!selectedRunDetails || selectedRunDetails.results.length === 0 || exportingPdf}
                  className="btn-ghost !px-2 !py-1 !text-[10px]">
                  {exportingPdf ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />} PDF
                </button>
                <button onClick={handleExportCsv}
                  disabled={!selectedRunDetails || selectedRunDetails.results.length === 0}
                  className="btn-ghost !px-2 !py-1 !text-[10px]">
                  <Download size={10} /> CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden">
          {rightPanel === 'logs' ? (
            <div className="flex h-full flex-col p-3">
              {connectionError && <p className="mb-1 shrink-0 text-[10px] text-red-500 dark:text-red-400">{connectionError}</p>}
              <pre className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-950 dark:bg-gray-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-400">
                {(logView === 'cli' ? cliText : structuredText) || '$ Waiting for logs... Select a run and press Execute.'}
              </pre>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {!selectedRunId ? (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-gray-500">Select a run</div>
              ) : runDetailsLoading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Loading...
                </div>
              ) : selectedRunDetails ? (
                <>
                  {/* Stats bar */}
                  <div className="flex shrink-0 gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2">
                    {[
                      { label: 'Total', value: selectedRunDetails.total_tests, cls: 'text-gray-900 dark:text-white' },
                      { label: 'Pass', value: selectedRunDetails.passed_tests, cls: 'text-emerald-600 dark:text-emerald-400' },
                      { label: 'Fail', value: selectedRunDetails.failed_tests, cls: 'text-red-600 dark:text-red-400' },
                      { label: 'Skip', value: selectedRunDetails.skipped_tests, cls: 'text-gray-500 dark:text-gray-400' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 px-2.5 py-1.5">
                        <span className={`text-sm font-bold ${cls}`}>{value}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Results list */}
                  <div className="flex-1 overflow-y-auto">
                    {selectedRunDetails.results.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No results yet.</p>
                    ) : (
                      selectedRunDetails.results.map(result => {
                        const isExpanded = expandedResultId === result.id
                        return (
                          <div key={result.id} className="border-b border-gray-100 dark:border-gray-700/50">
                            <button
                              onClick={() => setExpandedResultId(isExpanded ? null : result.id)}
                              className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-200">{result.test_name}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {result.class_name || 'No class'} · {formatDuration(result.duration_ms)}
                                </p>
                              </div>
                              <StatusBadge status={result.status || 'error'} />
                            </button>
                            {isExpanded && (result.error_message || result.stack_trace) && (
                              <div className="space-y-2 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/30 px-3 py-2">
                                {result.error_message && (
                                  <div>
                                    <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400">Error</p>
                                    <p className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 p-2 text-[11px] text-red-700 dark:text-red-300">{result.error_message}</p>
                                  </div>
                                )}
                                {result.stack_trace && (
                                  <div>
                                    <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Stack Trace</p>
                                    <pre className="max-h-32 overflow-auto rounded-lg bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 font-mono text-[10px] text-gray-300">{result.stack_trace}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

