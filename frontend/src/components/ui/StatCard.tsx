import type { LucideIcon } from 'lucide-react'

const PALETTE: Record<string, string> = {
  cyan:    'from-cyan-500/20 to-cyan-500/5 text-cyan-400',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  rose:    'from-rose-500/20 to-rose-500/5 text-rose-400',
  amber:   'from-amber-500/20 to-amber-500/5 text-amber-400',
  indigo:  'from-indigo-500/20 to-indigo-500/5 text-indigo-400',
  blue:    'from-blue-500/20 to-blue-500/5 text-blue-400',
}

export function StatCard({
  title, value, icon: Icon, accent, sub,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  accent: string
  sub?: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div className={`absolute inset-0 bg-gradient-to-br ${PALETTE[accent] || PALETTE.cyan} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="relative flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${PALETTE[accent] || PALETTE.cyan} bg-gradient-to-br`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold tracking-tight text-white">{value}</p>
            <p className="text-xs text-slate-400">{title}</p>
          </div>
          {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  )
}
