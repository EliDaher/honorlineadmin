import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { EmptyState, cx } from '@/app/_components/ui'

type SimpleRowsProps = {
  rows: string[][]
  empty: string
  icon?: LucideIcon
  actions?: ReactNode[]
}

export function SimpleRows({ rows, empty, icon, actions }: SimpleRowsProps) {
  if (rows.length === 0) return <EmptyState title={empty} icon={icon} />
  const hasActions = Boolean(actions?.length)

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {rows.map((row, rowIndex) => (
        <div key={`${row[0]}-${rowIndex}`} className={cx('grid gap-2 px-3 py-3 text-sm', hasActions ? 'sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-center' : 'sm:grid-cols-3')}>
          {row.map((cell, cellIndex) => (
            <span key={`${cell}-${cellIndex}`} className={cx('min-w-0 truncate', cellIndex === 0 ? 'font-semibold text-slate-950' : 'text-slate-600')}>
              {cell}
            </span>
          ))}
          {hasActions ? <div className="sm:justify-self-end">{actions?.[rowIndex]}</div> : null}
        </div>
      ))}
    </div>
  )
}
