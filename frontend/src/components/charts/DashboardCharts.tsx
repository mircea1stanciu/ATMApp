import { Activity, Clock } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface RunTrendPoint {
  runLabel: string
  runShortId: string
  passRate: number
  durationSeconds: number | null
}

interface DashboardChartsProps {
  runTrendData: RunTrendPoint[]
}

export default function DashboardCharts({ runTrendData }: DashboardChartsProps) {
  return (
    <div className="grid h-full gap-3 lg:grid-cols-2">
      {/* Pass Rate */}
      <div className="flex min-h-0 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Pass Rate Trend</h3>
            <p className="text-[11px] text-slate-500">Evoluție % per run</p>
          </div>
          <Activity size={14} className="text-slate-600" />
        </div>
        {runTrendData.length === 0
          ? <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Niciun run</div>
          : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={runTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="runLabel" stroke="rgba(100,116,139,0.4)" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="rgba(100,116,139,0.4)" tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 11 }}
                    formatter={(v: number) => [`${v}%`, 'Pass Rate']}
                    labelFormatter={(v, p) => `Run ${p?.[0]?.payload?.runShortId || v}`}
                  />
                  <Line type="monotone" dataKey="passRate" name="Pass Rate" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2.5, fill: '#0ea5e9' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

      {/* Duration */}
      <div className="flex min-h-0 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Execution Duration</h3>
            <p className="text-[11px] text-slate-500">Durată per run (secunde)</p>
          </div>
          <Clock size={14} className="text-slate-600" />
        </div>
        {runTrendData.length === 0
          ? <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Niciun run</div>
          : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={runTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="runLabel" stroke="rgba(100,116,139,0.4)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(100,116,139,0.4)" tick={{ fontSize: 10 }} unit="s" />
                  <Tooltip
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 11 }}
                    formatter={v => {
                      const n = typeof v === 'number' ? v : Number(v)
                      return [Number.isNaN(n) ? '-' : `${n}s`, 'Duration']
                    }}
                    labelFormatter={(v, p) => `Run ${p?.[0]?.payload?.runShortId || v}`}
                  />
                  <Line type="monotone" dataKey="durationSeconds" name="Duration" stroke="#34d399" strokeWidth={2} dot={{ r: 2.5, fill: '#34d399' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>
    </div>
  )
}
