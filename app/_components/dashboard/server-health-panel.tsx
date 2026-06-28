'use client'

import { RefreshCw, Server } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { apiRequest, authHeaders } from '../../_lib/api'
import { dateShort } from '../../_lib/format'
import {
  dashboardPingCount,
  dashboardPingIntervalMs,
  dashboardPingTarget,
  formatPingAverage,
  formatPingNumber,
  pingStatusLabels,
  pingStatusTones
} from '../../_lib/server-ping'
import type { ApiResponse, ManagedServer, ServerApiResult, ServerPingSummary } from '../../_lib/types'
import { Button, EmptyState, Panel, StatusPill } from '../ui'

type DashboardPingState = {
  summary?: ServerPingSummary
  fetchedAt?: string
  error?: string
  loading: boolean
}

export function ServerHealthPanel({ servers, token }: { servers: ManagedServer[]; token: string }) {
  const [pingStates, setPingStates] = useState<Record<string, DashboardPingState>>({})

  const checkServer = useCallback(async (server: ManagedServer) => {
    setPingStates((current) => ({
      ...current,
      [server.id]: {
        ...current[server.id],
        loading: true,
        error: undefined
      }
    }))

    try {
      const result = await apiRequest<ApiResponse<ServerApiResult>>(`/api/servers/${server.id}/ping`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ address: dashboardPingTarget, count: dashboardPingCount })
      })
      const fallbackSummary: ServerPingSummary = {
        address: dashboardPingTarget,
        count: dashboardPingCount,
        avgMs: null,
        received: 0,
        transmitted: dashboardPingCount,
        lossPercent: 100,
        status: result.data.error?.code === 'SERVER_AUTH_FAILED' ? 'auth_error' : 'error'
      }

      setPingStates((current) => ({
        ...current,
        [server.id]: {
          summary: result.data.summary ?? fallbackSummary,
          fetchedAt: result.data.fetchedAt,
          error: result.data.error?.message,
          loading: false
        }
      }))
    } catch (requestError) {
      setPingStates((current) => ({
        ...current,
        [server.id]: {
          summary: {
            address: dashboardPingTarget,
            count: dashboardPingCount,
            avgMs: null,
            received: 0,
            transmitted: dashboardPingCount,
            lossPercent: 100,
            status: 'error'
          },
          fetchedAt: new Date().toISOString(),
          error: requestError instanceof Error ? requestError.message : 'فشل فحص السيرفر',
          loading: false
        }
      }))
    }
  }, [token])

  const checkAllServers = useCallback(() => {
    if (!token || servers.length === 0) return
    servers.forEach((server) => {
      void checkServer(server)
    })
  }, [checkServer, servers, token])

  useEffect(() => {
    checkAllServers()
    const intervalId = window.setInterval(checkAllServers, dashboardPingIntervalMs)
    return () => window.clearInterval(intervalId)
  }, [checkAllServers])

  const anyLoading = Object.values(pingStates).some((state) => state.loading)

  return (
    <Panel
      title="حالة السيرفرات"
      description={`فحص تلقائي إلى ${dashboardPingTarget} كل ${formatPingNumber(dashboardPingIntervalMs / 1000, 0)} ثانية.`}
      actions={
        <Button type="button" variant="secondary" icon={RefreshCw} loading={anyLoading} onClick={checkAllServers}>
          تحديث الآن
        </Button>
      }
    >
      {servers.length === 0 ? (
        <EmptyState title="لا توجد سيرفرات محفوظة بعد." description="أضف سيرفر من صفحة السيرفرات ليظهر هنا." icon={Server} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {servers.map((server) => {
            const state = pingStates[server.id]
            const summary = state?.summary
            const status = summary?.status ?? 'error'

            return (
              <div key={server.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{server.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500" dir="ltr">{server.apiBaseUrl}</p>
                  </div>
                  <StatusPill tone={summary ? pingStatusTones[status] : 'neutral'}>
                    {state?.loading && !summary ? 'جاري الفحص' : summary ? pingStatusLabels[status] : 'بانتظار الفحص'}
                  </StatusPill>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Avg</p>
                    <p className="mt-1 font-semibold text-slate-950" dir="ltr">{formatPingAverage(summary?.avgMs)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Received</p>
                    <p className="mt-1 font-semibold text-slate-950" dir="ltr">{summary ? `${summary.received}/${summary.transmitted}` : '--'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs text-slate-500">Loss</p>
                    <p className="mt-1 font-semibold text-slate-950" dir="ltr">{summary ? `${formatPingNumber(summary.lossPercent)}%` : '--'}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>{state?.fetchedAt ? `آخر فحص: ${dateShort(state.fetchedAt)}` : 'لم يتم الفحص بعد'}</span>
                  <Button type="button" variant="quiet" icon={RefreshCw} loading={state?.loading} onClick={() => void checkServer(server)} className="min-h-8 px-2.5 py-1 text-xs">
                    إعادة الفحص
                  </Button>
                </div>
                {state?.error ? <p className="mt-2 text-xs text-rose-700">{state.error}</p> : null}
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
