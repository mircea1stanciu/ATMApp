import { useEffect, useMemo } from 'react'
import {
  AlertTriangle, ArrowLeftRight, CheckCircle2, Loader2,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { StatusBadge } from '@/components/ui/StatusBadge'

export default function AnalyticsPage() {
  const runs = useAppStore(s => s.runs)
  const selectedProjectId = useAppStore(s => s.selectedProjectId)
  const loadProjectData = useAppStore(s => s.loadProjectData)
  const compareRunAId = useAppStore(s => s.compareRunAId)
  const setCompareRunAId = useAppStore(s => s.setCompareRunAId)
  const compareRunBId = useAppStore(s => s.compareRunBId)
  const setCompareRunBId = useAppStore(s => s.setCompareRunBId)
  const compareLoading = useAppStore(s => s.compareLoading)
  const runComparisonSummary = useAppStore(s => s.runComparisonSummary)
  const runComparisonItems = useAppStore(s => s.runComparisonItems)
  const flakyLoading = useAppStore(s => s.flakyLoading)
  const flakyTests = useAppStore(s => s.flakyTests)
  const computeFlakyTests = useAppStore(s => s.computeFlakyTests)
  const loadComparison = useAppStore(s => s.loadComparison)

  useEffect(() => {
    if (selectedProjectId) void loadProjectData(selectedProjectId)
  }, [selectedProjectId, loadProjectData])

  useEffect(() => { void computeFlakyTests() }, [runs, computeFlakyTests])
  useEffect(() => { void loadComparison() }, [compareRunAId, compareRunBId, loadComparison])

  const runsByNewest = useMemo(() =>
    [...runs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [runs])

  return (
    <div className="flex h-full gap-3">
      {/* ── Left: Run Comparison ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={14} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Run Comparison</h3>
          </div>
        </div>

        {/* Selectors */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5">
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-gray-400">Run A (baseline)</label>
            <select value={compareRunAId || ''} onChange={e => setCompareRunAId(e.target.value || null)} className="form-input !py-1.5 !text-xs">
              {runsByNewest.map(r => <option key={`a-${r.id}`} value={r.id}>{r.id.slice(0, 8)} · {r.status} · {r.branch}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-gray-500 dark:text-gray-400">Run B (target)</label>
            <select value={compareRunBId || ''} onChange={e => setCompareRunBId(e.target.value || null)} className="form-input !py-1.5 !text-xs">
              {runsByNewest.map(r => <option key={`b-${r.id}`} value={r.id}>{r.id.slice(0, 8)} · {r.status} · {r.branch}</option>)}
            </select>
          </div>
        </div>

        {compareRunAId === compareRunBId && (
          <p className="shrink-0 px-4 py-1.5 text-[10px] text-amber-600 dark:text-amber-400">Select different runs.</p>
        )}

        {/* Summary cards */}
        {!compareLoading && runComparisonSummary && (
          <div className="flex shrink-0 gap-2 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
            {[
              { label: 'Total', value: runComparisonSummary.totalCompared, cls: 'text-gray-900 dark:text-white' },
              { label: 'Changed', value: runComparisonSummary.changed, cls: 'text-amber-600 dark:text-amber-400' },
              { label: 'Regr', value: runComparisonSummary.regressions, cls: 'text-red-600 dark:text-red-400' },
              { label: 'Fix', value: runComparisonSummary.fixes, cls: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Add', value: runComparisonSummary.added, cls: 'text-blue-600 dark:text-blue-400' },
              { label: 'Rem', value: runComparisonSummary.removed, cls: 'text-gray-500 dark:text-gray-400' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 px-2 py-1">
                <span className={`text-sm font-bold ${cls}`}>{value}</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Diff list */}
        <div className="flex-1 overflow-y-auto">
          {compareLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          ) : runComparisonItems.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              {runComparisonSummary ? 'No differences' : 'Select runs to compare'}
            </div>
          ) : (
            runComparisonItems.map(item => (
              <div key={item.key} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-4 py-2.5">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-200">{item.testName}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.className || 'No class'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge status={item.statusA} />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">→</span>
                  <StatusBadge status={item.statusB} />
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    item.kind === 'regression' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    item.kind === 'fix' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                    item.kind === 'added' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    item.kind === 'removed' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>{item.kind}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Flaky Tests ── */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Flaky Tests</h3>
          </div>
          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Unstable tests from the last 20 runs</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {flakyLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <Loader2 size={14} className="animate-spin" /> Analyzing...
            </div>
          ) : flakyTests.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <CheckCircle2 size={28} className="mb-3 text-emerald-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No flaky tests detected</p>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Everything looks stable</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {flakyTests.map(item => (
                <div key={item.key} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-xs font-semibold text-gray-900 dark:text-white">{item.testName}</p>
                    <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      {item.instability}%
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">{item.className || 'No class'}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-400">{item.executions} runs</span>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">✓ {item.passed}</span>
                    <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-red-700 dark:text-red-300">✗ {item.failed}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
