import Image from 'next/image'
import Link from 'next/link'
import { LogOut, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { User, ViewKey } from '@/app/_lib/types'
import { Alert, Button, StatusPill, cx } from '@/app/_components/ui'
import { navigationItems, viewTitle } from '../constants/navigation'

type AppShellProps = {
  view: ViewKey
  user: User | null
  loading: boolean
  error: string
  success: string
  onRefresh: () => void
  onLogout: () => void
  children: ReactNode
}

export function AppShell({ view, user, loading, error, success, onRefresh, onLogout, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-slate-800 bg-slate-950 px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-68 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3"><Image src="/branding/honorline-logo.png" alt="HonorLine" width={56} height={56} priority className="h-11 w-11 rounded-lg object-cover ring-1 ring-white/10" /><div className="min-w-0"><p className="truncate text-base font-semibold">HonorLine</p><p className="text-xs text-slate-400">إدارة المخزون والمحاسبة</p></div></div>
          <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:mt-7 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="القائمة الرئيسية">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return <Link key={item.key} href={item.href} className={cx('inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition', view === item.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white')}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span>{item.label}</span></Link>
            })}
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold text-blue-700">نظام إدارة ومحاسبة احترافي</p><h1 className="mt-0.5 truncate text-2xl font-semibold text-slate-950">{viewTitle(view)}</h1></div><div className="flex flex-wrap items-center gap-2"><StatusPill tone="blue">{user?.username || 'admin'}</StatusPill><Button type="button" variant="secondary" icon={RefreshCw} onClick={onRefresh} loading={loading}>تحديث</Button><Button type="button" variant="quiet" icon={LogOut} onClick={onLogout}>خروج</Button></div></div></header>
          <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">{error ? <Alert tone="danger">{error}</Alert> : null}{success ? <Alert tone="success">{success}</Alert> : null}{loading ? <Alert tone="neutral">جارٍ تحميل بيانات الصفحة...</Alert> : null}{children}</div>
        </section>
      </div>
    </main>
  )
}
