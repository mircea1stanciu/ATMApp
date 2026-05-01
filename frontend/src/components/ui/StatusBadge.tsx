const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  pending:   { dot: 'bg-amber-400',                bg: 'bg-amber-900/30',   text: 'text-amber-300'   },
  running:   { dot: 'bg-blue-400 animate-pulse',   bg: 'bg-blue-900/30',    text: 'text-blue-300'    },
  passed:    { dot: 'bg-emerald-400',               bg: 'bg-emerald-900/30', text: 'text-emerald-300' },
  failed:    { dot: 'bg-red-400',                   bg: 'bg-red-900/30',     text: 'text-red-300'     },
  error:     { dot: 'bg-orange-400',                bg: 'bg-orange-900/30',  text: 'text-orange-300'  },
  skipped:   { dot: 'bg-zinc-500',                  bg: 'bg-zinc-800/40',    text: 'text-zinc-400'    },
  cancelled: { dot: 'bg-slate-500',                 bg: 'bg-slate-800/40',   text: 'text-slate-400'   },
  missing:   { dot: 'bg-slate-600',                 bg: 'bg-slate-800/40',   text: 'text-slate-500'   },
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.error
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
