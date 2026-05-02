import type { LucideIcon } from 'lucide-react'

const PALETTE: Record<string, { icon: string; bg: string }> = {
  cyan:    { icon: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-100 dark:bg-cyan-500/20' },
  emerald: { icon: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
  rose:    { icon: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-100 dark:bg-rose-500/20' },
  amber:   { icon: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-100 dark:bg-amber-500/20' },
  indigo:  { icon: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
  blue:    { icon: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-100 dark:bg-blue-500/20' },
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
  const palette = PALETTE[accent] ?? PALETTE.blue
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${palette.bg} ${palette.icon}`}>
          <Icon size={18} />
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
