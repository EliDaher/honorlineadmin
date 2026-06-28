'use client'

import { useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Loader2, Pencil, Trash2, X } from 'lucide-react'
import type { Currency } from '../_lib/types'

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function StatusPill({
  tone,
  children
}: {
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'blue'
  children: React.ReactNode
}) {
  const tones = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
    blue: 'border-blue-200 bg-blue-50 text-blue-700'
  }

  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}

export function Field({
  label,
  children,
  hint
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1.5 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export function inputClass(className = '') {
  return cx(
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400',
    'focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
    className
  )
}

export function Button({
  children,
  variant = 'primary',
  icon: Icon,
  loading = false,
  className,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  icon?: LucideIcon
  loading?: boolean
}) {
  const variants = {
    primary: 'border border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none',
    secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 disabled:text-slate-400',
    quiet: 'border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400',
    danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:text-rose-300'
  }

  const DisplayIcon = loading ? Loader2 : Icon

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        className
      )}
    >
      {DisplayIcon ? <DisplayIcon className={cx('h-4 w-4 shrink-0', loading && 'animate-spin')} aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </button>
  )
}

export function RowActions({
  onEdit,
  onDelete,
  editLoading = false,
  deleteLoading = false,
  editDisabled = false,
  deleteDisabled = false
}: {
  onEdit: () => void
  onDelete: () => void
  editLoading?: boolean
  deleteLoading?: boolean
  editDisabled?: boolean
  deleteDisabled?: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button type="button" variant="secondary" icon={Pencil} loading={editLoading} disabled={editDisabled} onClick={onEdit} className="min-h-9 px-3 py-1.5">
        تعديل
      </Button>
      <Button type="button" variant="danger" icon={Trash2} loading={deleteLoading} disabled={deleteDisabled} onClick={onDelete} className="min-h-9 px-3 py-1.5">
        حذف
      </Button>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md'
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose, open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" aria-label="إغلاق النافذة" className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <section className={cx('relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 animate-modal-in', sizes[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg font-bold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <Button type="button" variant="quiet" icon={X} onClick={onClose} className="h-10 w-10 shrink-0 px-0" aria-label="إغلاق">
            <span className="sr-only">إغلاق</span>
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">{footer}</div> : null}
      </section>
    </div>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cx('overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-900/5 animate-soft-in', className)}>
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue'
}: {
  label: string
  value: string
  detail: string
  icon?: LucideIcon
  tone?: 'blue' | 'emerald' | 'amber' | 'slate'
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200'
  }

  return (
    <section className="lift-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 animate-soft-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-950">{value}</p>
        </div>
        {Icon ? (
          <span className={cx('rounded-lg p-2 ring-1', tones[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </section>
  )
}

export function Alert({
  tone,
  children
}: {
  tone: 'success' | 'danger' | 'neutral'
  children: React.ReactNode
}) {
  const tones = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
    neutral: 'border-slate-200 bg-white text-slate-700'
  }

  return <p className={cx('rounded-lg border px-4 py-3 text-sm shadow-sm', tones[tone])}>{children}</p>
}

export function EmptyState({
  title,
  description,
  icon: Icon
}: {
  title: string
  description?: string
  icon?: LucideIcon
}) {
  return (
    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
      <div>
        {Icon ? <Icon className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" /> : null}
        <p className="mt-2 text-sm font-semibold text-slate-700">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
    </div>
  )
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return <div className="-mx-5 overflow-x-auto px-5">{children}</div>
}

export function tableClass() {
  return 'w-full min-w-[760px] border-separate border-spacing-0 text-right text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-slate-50/80'
}

export function thClass() {
  return 'border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500'
}

export function tdClass(className = '') {
  return cx('border-b border-slate-100 px-4 py-3.5 text-slate-700', className)
}

export function CurrencySelect({ value, onChange, disabled = false }: { value: Currency; onChange: (value: Currency) => void; disabled?: boolean }) {
  return (
    <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as Currency)} className={inputClass()}>
      <option value="USD">USD</option>
      <option value="SYP">SYP</option>
    </select>
  )
}
