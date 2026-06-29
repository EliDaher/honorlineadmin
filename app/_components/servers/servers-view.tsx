'use client'

import { Network, RefreshCw, Save, Server, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { apiRequest, authHeaders } from '../../_lib/api'
import { dateShort } from '../../_lib/format'
import {
  formatPingAverage,
  formatPingNumber,
  pingStatusLabels,
  pingStatusTones
} from '../../_lib/server-ping'
import type { ApiResponse, InventoryData, ManagedServer, ServerApiResult } from '../../_lib/types'
import { Alert, Button, EmptyState, Field, Modal, Panel, StatusPill, inputClass } from '../ui'
import { ResultViewer } from './result-viewer'

const emptyServerForm = {
  name: '',
  apiBaseUrl: '',
  username: 'admin',
  password: '',
  notes: ''
}

type ServersViewProps = {
  data: InventoryData
  token: string
  mutate: (action: string, run: () => Promise<unknown>) => Promise<void>
  saving: string
}

export function ServersView({ data, token, mutate, saving }: ServersViewProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ManagedServer | null>(null)
  const [form, setForm] = useState(emptyServerForm)
  const [actionLoading, setActionLoading] = useState('')
  const [localError, setLocalError] = useState('')
  const [resourceResults, setResourceResults] = useState<Record<string, ServerApiResult>>({})
  const [pingResults, setPingResults] = useState<Record<string, ServerApiResult>>({})
  const [pingForms, setPingForms] = useState<Record<string, { address: string; count: string }>>({})

  function openCreate() {
    setEditing(null)
    setForm(emptyServerForm)
    setOpen(true)
  }

  function openEdit(server: ManagedServer) {
    setEditing(server)
    setForm({
      name: server.name,
      apiBaseUrl: server.apiBaseUrl,
      username: server.username,
      password: '',
      notes: server.notes
    })
    setOpen(true)
  }

  async function runServerAction(action: string, run: () => Promise<void>) {
    setActionLoading(action)
    setLocalError('')
    try {
      await run()
    } catch (requestError) {
      setLocalError(requestError instanceof Error ? requestError.message : 'فشلت العملية')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'تعديل سيرفر' : 'إضافة سيرفر'} description="احفظ رابط REST وبيانات الدخول لاستخدامها من الخلفية فقط." size="lg">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate(editing ? `server-edit-${editing.id}` : 'server-create', async () => {
              const body = editing && form.password.trim().length === 0 ? { ...form, password: undefined } : form
              await apiRequest(editing ? `/api/servers/${editing.id}` : '/api/servers', {
                method: editing ? 'PATCH' : 'POST',
                headers: authHeaders(token),
                body: JSON.stringify(body)
              })
              setForm(emptyServerForm)
              setEditing(null)
              setOpen(false)
            })
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم السيرفر">
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="اسم المستخدم">
              <input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className={inputClass()} autoComplete="username" />
            </Field>
          </div>
          <Field label="رابط API">
            <input required value={form.apiBaseUrl} onChange={(event) => setForm({ ...form, apiBaseUrl: event.target.value })} className={inputClass('text-left')} dir="ltr" placeholder="http://78.155.64.242/rest/system/resource" />
          </Field>
          <Field label="كلمة المرور" hint={editing ? 'اتركها فارغة للإبقاء على كلمة المرور الحالية.' : undefined}>
            <input required={!editing} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass('text-left')} dir="ltr" autoComplete="new-password" />
          </Field>
          <Field label="ملاحظات">
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={inputClass()} rows={3} />
          </Field>
          <Button loading={saving === (editing ? `server-edit-${editing.id}` : 'server-create')} icon={Save}>
            {editing ? 'حفظ التعديل' : 'إضافة سيرفر'}
          </Button>
        </form>
      </Modal>

      {localError ? <Alert tone="danger">{localError}</Alert> : null}

      <Panel
        title="السيرفرات"
        description="إدارة سيرفرات MikroTik REST وجلب الموارد وتشغيل Ping من السيرفر نفسه."
        actions={
          <Button type="button" icon={Server} onClick={openCreate}>
            إضافة سيرفر
          </Button>
        }
      >
        {data.servers.length === 0 ? (
          <EmptyState title="لا توجد سيرفرات بعد." description="أضف سيرفر MikroTik REST للبدء." icon={Server} />
        ) : (
          <div className="space-y-3">
            {data.servers.map((server) => {
              const pingForm = pingForms[server.id] || { address: '8.8.8.8', count: '4' }
              const resourceResult = resourceResults[server.id]
              const pingResult = pingResults[server.id]

              return (
                <div key={server.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/servers/${server.id}`} className="truncate text-base font-semibold text-slate-950 transition hover:text-cyan-700">
                          {server.name}
                        </Link>
                        <StatusPill tone={server.hasPassword ? 'success' : 'warning'}>{server.hasPassword ? 'بيانات الدخول محفوظة' : 'بدون كلمة مرور'}</StatusPill>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500" dir="ltr">{server.apiBaseUrl}</p>
                      <p className="mt-1 text-sm text-slate-500">{server.notes || 'لا توجد ملاحظات'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/servers/${server.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 active:scale-[0.98]"
                      >
                        <Network className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">التفاصيل</span>
                      </Link>
                      <Button type="button" variant="secondary" icon={RefreshCw} loading={actionLoading === `resource-${server.id}`} onClick={() => runServerAction(`resource-${server.id}`, async () => {
                        const result = await apiRequest<ApiResponse<ServerApiResult>>(`/api/servers/${server.id}/resource`, { headers: authHeaders(token) })
                        setResourceResults({ ...resourceResults, [server.id]: result.data })
                      })}>
                        جلب الموارد
                      </Button>
                      <Button type="button" variant="secondary" icon={Save} onClick={() => openEdit(server)}>
                        تعديل
                      </Button>
                      <Button type="button" variant="danger" icon={Trash2} loading={saving === `server-delete-${server.id}`} onClick={() => {
                        if (!window.confirm(`حذف السيرفر ${server.name}?`)) return
                        mutate(`server-delete-${server.id}`, async () => {
                          await apiRequest(`/api/servers/${server.id}`, { method: 'DELETE', headers: authHeaders(token) })
                        })
                      }}>
                        حذف
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_120px_130px]">
                    <input value={pingForm.address} onChange={(event) => setPingForms({ ...pingForms, [server.id]: { ...pingForm, address: event.target.value } })} className={inputClass('text-left')} dir="ltr" placeholder="8.8.8.8" />
                    <input type="number" min="1" max="20" value={pingForm.count} onChange={(event) => setPingForms({ ...pingForms, [server.id]: { ...pingForm, count: event.target.value } })} className={inputClass()} />
                    <Button type="button" variant="secondary" icon={RefreshCw} loading={actionLoading === `ping-${server.id}`} onClick={() => runServerAction(`ping-${server.id}`, async () => {
                      const result = await apiRequest<ApiResponse<ServerApiResult>>(`/api/servers/${server.id}/ping`, {
                        method: 'POST',
                        headers: authHeaders(token),
                        body: JSON.stringify({ address: pingForm.address, count: Number(pingForm.count) })
                      })
                      setPingResults({ ...pingResults, [server.id]: result.data })
                    })}>
                      تشغيل Ping
                    </Button>
                  </div>

                  {resourceResult ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-3 text-sm font-semibold text-slate-950">الموارد - {dateShort(resourceResult.fetchedAt)}</p>
                      <ResultViewer data={resourceResult.result} />
                    </div>
                  ) : null}

                  {pingResult ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-3 text-sm font-semibold text-slate-950">نتيجة Ping - {dateShort(pingResult.fetchedAt)}</p>
                      {pingResult.summary ? (
                        <div className="mb-3 grid gap-2 text-sm sm:grid-cols-4">
                          <StatusPill tone={pingStatusTones[pingResult.summary.status]}>{pingStatusLabels[pingResult.summary.status]}</StatusPill>
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" dir="ltr">Avg: {formatPingAverage(pingResult.summary.avgMs)}</span>
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" dir="ltr">Received: {pingResult.summary.received}/{pingResult.summary.transmitted}</span>
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" dir="ltr">Loss: {formatPingNumber(pingResult.summary.lossPercent)}%</span>
                        </div>
                      ) : null}
                      {pingResult.error ? <p className="mb-3 text-sm text-rose-700">{pingResult.error.message}</p> : null}
                      {pingResult.result !== null ? <ResultViewer data={pingResult.result} /> : <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">لا توجد نتيجة خام من السيرفر.</p>}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </section>
  )
}
