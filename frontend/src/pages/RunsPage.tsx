import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  BarChart2, Download, GitBranch, Loader2,
  PlayCircle, Plus, Terminal,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useRunWebSocket } from '@/hooks/useRunWebSocket'
import { StatusBadge } from '@/components/ui/StatusBadge'

type RightPanel = 'logs' | 'results'

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

export default function RunsPage() {
  const selectedProjectId = useAppStore(s => s.selectedProjectId)
  const suites = useAppStore(s => s.suites)
  const selectedSuiteId = useAppStore(s => s.selectedSuiteId)
  const setSelectedSuiteId = useAppStore(s => s.setSelectedSuiteId)
  const suiteForm = useAppStore(s => s.suiteForm)
  const setSuiteForm = useAppStore(s => s.setSuiteForm)
  const createSuite = useAppStore(s => s.createSuite)
  const schedulerDrafts = useAppStore(s => s.schedulerDrafts)
  const setSchedulerDrafts = useAppStore(s => s.setSchedulerDrafts)
  const saveScheduler = useAppStore(s => s.saveScheduler)
  const savingSchedulerSuiteId = useAppStore(s => s.savingSchedulerSuiteId)
  const runs = useAppStore(s => s.runs)
  const selectedRunId = useAppStore(s => s.selectedRunId)
  const setSelectedRunId = useAppStore(s => s.setSelectedRunId)
  const selectedRunDetails = useAppStore(s => s.selectedRunDetails)
  const runDetailsLoading = useAppStore(s => s.runDetailsLoading)
  const expandedResultId = useAppStore(s => s.expandedResultId)
  const setExpandedResultId = useAppStore(s => s.setExpandedResultId)
  const runBranch = useAppStore(s => s.runBranch)
  const setRunBranch = useAppStore(s => s.setRunBranch)
  const branches = useAppStore(s => s.branches)
  const createRun = useAppStore(s => s.createRun)
  const executeRun = useAppStore(s => s.executeRun)
  const loadRunDetails = useAppStore(s => s.loadRunDetails)
  const loadProjectData = useAppStore(s => s.loadProjectData)

  const [rightPanel, setRightPanel] = useState<RightPanel>('logs')
  const [exportingPdf, setExportingPdf] = useState(false)

  const { groupedText, connected, connectionError, clearMessages } = useRunWebSocket({
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

  const handleCreateSuite = async (e: FormEvent) => {
    e.preventDefault()
    await createSuite()
  }

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
      {/* ── Col 1: Suites ── */}
      <div className="flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="shrink-0 border-b border-white/[0.04] px-3 py-2.5">
          <h3 className="text-xs font-semibold text-white">Suite</h3>
        </div>
        {/* Create suite inline */}
        <form onSubmit={handleCreateSuite} className="flex shrink-0 gap-1.5 border-b border-white/[0.04] p-2">
          <input className="form-input flex-1 !py-1.5 !px-2 !text-xs" placeholder="Nume suită" value={suiteForm.name}
            onChange={e => setSuiteForm(p => ({ ...p, name: e.target.value }))} required disabled={!selectedProjectId} />
          <button className="btn-primary !px-2 !py-1.5" disabled={!selectedProjectId}><Plus size={12} /></button>
        </form>
        {/* Suite list */}
        <div className="flex-1 overflow-y-auto">
          {suites.map(suite => {
            const isSelected = selectedSuiteId === suite.id
            return (
              <div key={suite.id} className={`border-b border-white/[0.03] ${isSelected ? 'bg-cyan-500/[0.06]' : ''}`}>
                <button onClick={() => setSelectedSuiteId(suite.id)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
                  <Terminal size={12} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">{suite.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {suite.active
                        ? <span className="rounded bg-emerald-900/30 px-1 py-0.5 text-[9px] text-emerald-400">ON</span>
                        : <span className="rounded bg-slate-800/40 px-1 py-0.5 text-[9px] text-slate-500">OFF</span>
                      }
                      {suite.cron_expression && <span className="font-mono text-[9px] text-slate-600">{suite.cron_expression}</span>}
                    </div>
                  </div>
                </button>
                {/* Scheduler inline */}
                {isSelected && (
                  <div className="border-t border-white/[0.03] px-3 py-2">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-600">Scheduler</p>
                    <div className="flex items-center gap-1">
                      <input className="form-input !py-1 !px-2 !text-[10px] flex-1" placeholder="cron"
                        value={schedulerDrafts[suite.id]?.cronExpression ?? suite.cron_expression ?? ''}
                        onChange={e => setSchedulerDrafts(p => ({ ...p, [suite.id]: { cronExpression: e.target.value, active: p[suite.id]?.active ?? suite.active } }))} />
                      <label className="flex items-center gap-1 text-[10px] text-slate-400">
                        <input type="checkbox" className="h-3 w-3 accent-cyan-400"
                          checked={schedulerDrafts[suite.id]?.active ?? suite.active}
                          onChange={e => setSchedulerDrafts(p => ({ ...p, [suite.id]: { cronExpression: p[suite.id]?.cronExpression ?? suite.cron_expression ?? '', active: e.target.checked } }))} />
                      </label>
                    </div>
                    <button onClick={() => void saveScheduler(suite.id)} disabled={savingSchedulerSuiteId === suite.id}
                      className="mt-1 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-1 text-[10px] text-slate-400 hover:text-white transition">
                      {savingSchedulerSuiteId === suite.id ? '...' : 'Salvează'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Col 2: Runs list + Create/Execute ── */}
      <div className="flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="shrink-0 border-b border-white/[0.04] px-3 py-2.5">
          <h3 className="text-xs font-semibold text-white">
            Runs <span className="text-slate-500">({runs.length})</span>
          </h3>
        </div>
        {/* Create run */}
        <div className="flex shrink-0 gap-1.5 border-b border-white/[0.04] p-2">
          <select value={runBranch} onChange={e => setRunBranch(e.target.value)} className="form-input !py-1.5 !px-2 !text-xs flex-1">
            {branches.length === 0 && <option value="main">main</option>}
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={() => void createRun()} disabled={!selectedSuiteId} className="btn-primary !px-2 !py-1.5 text-xs shrink-0">
            <PlayCircle size={12} /> New
          </button>
        </div>
        {/* Execute button */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] px-3 py-2">
          <span className="text-[10px] text-slate-500">
            {selectedRunId ? `Selectat: ${selectedRunId.slice(0, 8)}` : 'Selectează un run'}
          </span>
          <button onClick={() => void executeRun()} disabled={!selectedRunId} className="btn-primary !px-2.5 !py-1 text-[10px]">
            <PlayCircle size={11} /> Execute
          </button>
        </div>
        {/* Runs list */}
        <div className="flex-1 overflow-y-auto">
          {runs.length === 0 && <p className="py-8 text-center text-xs text-slate-500">Creează un run.</p>}
          {runsByNewest.map(run => (
            <button
              key={run.id}
              onClick={() => setSelectedRunId(run.id)}
              className={`flex w-full items-center justify-between border-b border-white/[0.03] px-3 py-2 text-left transition ${
                selectedRunId === run.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-slate-400">{run.id.slice(0, 8)}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-600">
                    <GitBranch size={9} />{run.branch || 'main'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{run.passed_tests}/{run.total_tests} passed</span>
              </div>
              <StatusBadge status={run.status} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Col 3: Logs / Results ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        {/* Panel tabs */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.04] px-3 py-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setRightPanel('logs')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                rightPanel === 'logs' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}>
              <Terminal size={12} /> Live Logs
            </button>
            <button onClick={() => setRightPanel('results')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                rightPanel === 'results' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-slate-200'
              }`}>
              <BarChart2 size={12} /> Rezultate
            </button>
          </div>
          <div className="flex items-center gap-2">
            {rightPanel === 'logs' && (
              <>
                <span className={`flex items-center gap-1 text-[10px] ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
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
              {connectionError && <p className="mb-1 shrink-0 text-[10px] text-red-400">{connectionError}</p>}
              <pre className="flex-1 overflow-auto rounded-xl border border-white/[0.04] bg-[#08080d] p-3 font-mono text-[11px] leading-relaxed text-emerald-300/90">
                {groupedText || '$ Așteaptă loguri... Selectează un run și apasă Execute.'}
              </pre>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {!selectedRunId ? (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Selectează un run</div>
              ) : runDetailsLoading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Se încarcă...
                </div>
              ) : selectedRunDetails ? (
                <>
                  {/* Stats bar */}
                  <div className="flex shrink-0 gap-2 border-b border-white/[0.04] px-3 py-2">
                    {[
                      { label: 'Total', value: selectedRunDetails.total_tests, cls: 'text-white' },
                      { label: 'Pass', value: selectedRunDetails.passed_tests, cls: 'text-emerald-400' },
                      { label: 'Fail', value: selectedRunDetails.failed_tests, cls: 'text-red-400' },
                      { label: 'Skip', value: selectedRunDetails.skipped_tests, cls: 'text-slate-500' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5">
                        <span className={`text-sm font-bold ${cls}`}>{value}</span>
                        <span className="text-[10px] text-slate-500">{label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Results list */}
                  <div className="flex-1 overflow-y-auto">
                    {selectedRunDetails.results.length === 0 ? (
                      <p className="py-8 text-center text-sm text-slate-500">Nu există rezultate încă.</p>
                    ) : (
                      selectedRunDetails.results.map(result => {
                        const isExpanded = expandedResultId === result.id
                        return (
                          <div key={result.id} className="border-b border-white/[0.03]">
                            <button
                              onClick={() => setExpandedResultId(isExpanded ? null : result.id)}
                              className="flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-white/[0.02]"
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="truncate text-xs font-medium text-slate-200">{result.test_name}</p>
                                <p className="text-[10px] text-slate-500">
                                  {result.class_name || 'No class'} · {formatDuration(result.duration_ms)}
                                </p>
                              </div>
                              <StatusBadge status={result.status || 'error'} />
                            </button>
                            {isExpanded && (result.error_message || result.stack_trace) && (
                              <div className="space-y-2 border-t border-white/[0.03] bg-white/[0.01] px-3 py-2">
                                {result.error_message && (
                                  <div>
                                    <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-red-400">Error</p>
                                    <p className="rounded-lg bg-red-900/20 border border-red-500/10 p-2 text-[11px] text-red-200">{result.error_message}</p>
                                  </div>
                                )}
                                {result.stack_trace && (
                                  <div>
                                    <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-500">Stack Trace</p>
                                    <pre className="max-h-32 overflow-auto rounded-lg bg-[#08080d] border border-white/[0.04] p-2 font-mono text-[10px] text-slate-300">{result.stack_trace}</pre>
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
