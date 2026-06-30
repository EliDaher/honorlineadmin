'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { AppShell } from '@/features/app-shell/components/AppShell'
import { LoginScreen } from '@/features/app-shell/components/LoginScreen'
import { useInventoryPage } from '@/features/app-shell/hooks/useInventoryPage'
import type { InventoryAppProps } from '@/features/app-shell/types'

export type { InventoryAppViewProps } from '@/features/app-shell/types'

/**
 * Shared page boundary for authenticated inventory features.
 * Feature modules own their data loader, UI, hooks and API calls; this component
 * owns only session state, feedback messages and the application layout.
 */
export function InventoryApp({ view, loadViewData, renderView }: InventoryAppProps) {
  const page = useInventoryPage(loadViewData)

  useEffect(() => {
    if (page.user?.role === 'worker' && view !== 'myCustody') {
      window.location.replace('/my-custody')
    }
  }, [page.user, view])

  if (!page.ready) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-700"><Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" /></main>
  }

  if (!page.token) return <LoginScreen onLogin={page.login} />

  return <AppShell view={view} user={page.user} loading={page.loading} error={page.error} success={page.success} onRefresh={() => void page.loadData()} onLogout={page.logout}>
    {renderView({ data: page.data, token: page.token, mutate: page.mutate, saving: page.saving })}
  </AppShell>
}
