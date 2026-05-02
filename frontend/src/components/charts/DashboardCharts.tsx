import { Activity, Clock } from 'lucide-react'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

interface RunTrendPoint {
  runLabel: string
  runShortId: string
  passRate: number
  durationSeconds: number | null
}

export default function DashboardCharts({ runTrendData }: { runTrendData: RunTrendPoint[] }) {
  const gridColor = 'rgba(148,163,184,0.15)'
  const axisColor = 'rgba(148,163,184,0.5)'

  return (
    <div className="grid h-full gap-4 lg:grid-cols-2">
      {/* Pass Rate */}
      <div className="flex min-h-0 flex-col">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pass Rate Trend</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">% per run</p>
          </div>
          <Activity size={14} className="text-gray-400 dark:text-gray-500" />
        </div>
        {runTrendData.length === 0
          ? <div className="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-gray-500">No runs</div>
          : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={runTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="runLabel" stroke={axisColor} tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke={axisColor} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: 12, fontSize: 11, color: 'var(--text-primary)' }}
                    formatter={(v: number) => [`${v}%`, 'Pass Rate']}
                    labelFormatter={(v, p) => `Run ${p?.[0]?.payload?.runShortId || v}`}
                  />
                  <Line type="monotone" dataKey="passRate" name="Pass Rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

      {/* Duration */}
      <div className="flex min-h-0 flex-col">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Execution Duration</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Seconds per run</p>
          </div>
          <Clock size={14} className="text-gray-400 dark:text-gray-500" />
        </div>
        {runTrendData.length === 0
          ? <div className="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-gray-500">No runs</div>
          : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={runTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="runLabel" stroke={axisColor} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 10 }} unit="s" />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: 12, fontSize: 11, color: 'var(--text-primary)' }}
                    formatter={v => {
                      const n = typeof v === 'number' ? v : Number(v)
                      return [Number.isNaN(n) ? '-' : `${n}s`, 'Duration']
                    }}
                    labelFormatter={(v, p) => `Run ${p?.[0]?.payload?.runShortId || v}`}
                  />
                  <Line type="monotone" dataKey="durationSeconds" name="Duration" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3, fill: '#7c3aed' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>
    </div>
  )
}
