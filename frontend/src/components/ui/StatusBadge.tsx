const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  pending:   { dot: 'bg-amber-400',               bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300'   },
  running:   { dot: 'bg-blue-400 animate-pulse',  bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300'     },
  passed:    { dot: 'bg-emerald-400',              bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  failed:    { dot: 'bg-red-400',                  bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300'       },
  error:     { dot: 'bg-orange-400',               bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300'  },
  skipped:   { dot: 'bg-gray-400',                 bg: 'bg-gray-100 dark:bg-gray-700/40',    text: 'text-gray-600 dark:text-gray-400'     },
  cancelled: { dot: 'bg-slate-400',                bg: 'bg-slate-100 dark:bg-slate-700/40',  text: 'text-slate-600 dark:text-slate-400'   },
  missing:   { dot: 'bg-gray-300',                 bg: 'bg-gray-100 dark:bg-gray-700/40',    text: 'text-gray-500 dark:text-gray-500'     },
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.error
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
