import { Suspense, lazy, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CheckCircle2, Loader2, Timer, XCircle, GitBranch } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'

const DashboardCharts = lazy(() => import('@/components/charts/DashboardCharts'))

function getRunDurationSeconds(run: { started_at: string | null; finished_at: string | null }): number | null {
  if (!run.started_at || !run.finished_at) return null
  const started = new Date(run.started_at).getTime()
  const finished = new Date(run.finished_at).getTime()
  if (Number.isNaN(started) || Number.isNaN(finished) || finished <= started) return null
  return Number(((finished - started) / 1000).toFixed(2))
}

export default function DashboardPage() {
  const runs = useAppStore(s => s.runs)
  const suites = useAppStore(s => s.suites)
  const selectedProjectId = useAppStore(s => s.selectedProjectId)
  const loadProjectData = useAppStore(s => s.loadProjectData)
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedProjectId) void loadProjectData(selectedProjectId)
  }, [selectedProjectId, loadProjectData])

  const runsByNewest = useMemo(() =>
    [...runs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [runs])

  const runTrendData = useMemo(() =>
    [...runs]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((run, i) => {
        const total = run.total_tests || 0
        const passRate = total > 0 ? Number(((run.passed_tests / total) * 100).toFixed(2)) : 0
        return { runLabel: `R${i + 1}`, runShortId: run.id.slice(0, 8), passRate, durationSeconds: getRunDurationSeconds(run) }
      }),
    [runs])

  const avgPassRate = useMemo(() => {
    if (runTrendData.length === 0) return 0
    return Math.round(runTrendData.reduce((s, d) => s + d.passRate, 0) / runTrendData.length)
  }, [runTrendData])

  const totalFailures = useMemo(() => runs.reduce((s, r) => s + r.failed_tests, 0), [runs])
  const activeSuites = useMemo(() => suites.filter(s => s.active).length, [suites])

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Stats row */}
      <div className="grid shrink-0 gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Runs" value={runs.length} icon={Activity} accent="indigo"
          sub={runsByNewest[0]?.status ? `Last: ${runsByNewest[0].status}` : 'no runs yet'} />
        <StatCard title="Pass Rate" value={`${avgPassRate}%`} icon={CheckCircle2} accent="emerald"
          sub={`across ${runs.length} runs`} />
        <StatCard title="Failures" value={totalFailures} icon={XCircle} accent="rose"
          sub="total failed" />
        <StatCard title="Active Suites" value={activeSuites} icon={Timer} accent="blue"
          sub={`${suites.length} total`} />
      </div>

      {/* Charts + Recent Runs */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_380px]">
        {/* Charts panel */}
        <div className="min-h-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Pass Rate Trend</h3>
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          }>
            <DashboardCharts runTrendData={runTrendData} />
          </Suspense>
        </div>

        {/* Recent runs panel */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
          <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Runs</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {runsByNewest.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4 py-8">
                <Activity size={28} className="mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No runs yet.</p>
                <button onClick={() => navigate('/runs')}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Create your first run →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {runsByNewest.slice(0, 20).map(run => (
                  <button
                    key={run.id}
                    onClick={() => { useAppStore.getState().setSelectedRunId(run.id); navigate('/runs') }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{run.id.slice(0, 8)}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                        <GitBranch size={10} />{run.branch || 'main'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">{run.passed_tests}/{run.total_tests}</span>
                      <StatusBadge status={run.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
