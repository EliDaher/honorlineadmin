'use client'

import { ExternalLink, Layers, ListFilter, RefreshCw, Search, Server, Table2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, EmptyState, Field, Panel, StatusPill, cx, inputClass } from '@/app/_components/ui'
import { dateShort } from '@/app/_lib/format'
import type { ManagedServer, ServerNeighbor, ServerNeighborsResult } from '@/app/_lib/types'
import { getServerNeighbors } from '../services/serversApi'

type ViewMode = 'zones' | 'table'

type IpRange = {
  start: number
  end: number
}

const neighborColumns = [
  { key: 'identity', label: 'الهوية' },
  { key: 'address', label: 'العنوان' },
  { key: 'mac-address', label: 'MAC' },
  { key: 'interface', label: 'الواجهة' },
  { key: 'board', label: 'Board' },
  { key: 'platform', label: 'Platform' },
  { key: 'version', label: 'Version' },
  { key: 'uptime', label: 'Uptime' },
  { key: 'age', label: 'Age' },
  { key: 'discovered-by', label: 'Discovered' }
] as const

function neighborAddress(neighbor: ServerNeighbor) {
  return neighbor.address || neighbor.address4 || ''
}

function neighborHref(neighbor: ServerNeighbor) {
  const address = neighborAddress(neighbor)
  if (!address) return ''
  return /^https?:\/\//i.test(address) ? address : `http://${address}`
}

function interfaceName(neighbor: ServerNeighbor) {
  return neighbor.interface || 'بدون واجهة'
}

function matchesSearch(neighbor: ServerNeighbor, query: string) {
  if (!query) return true
  return Object.values(neighbor).some((value) => String(value ?? '').toLowerCase().includes(query))
}

function parseIpv4(value: string) {
  const parts = value.trim().split('.')
  if (parts.length !== 4) return null

  const octets: number[] = []
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet < 0 || octet > 255) return null
    octets.push(octet)
  }

  return octets.reduce((result, octet) => (result << 8) + octet, 0) >>> 0
}

function parseCidrRange(value: string): IpRange | null {
  const [address, prefixText] = value.split('/')
  if (!address || prefixText === undefined || !/^\d{1,2}$/.test(prefixText)) return null

  const ip = parseIpv4(address)
  const prefix = Number(prefixText)
  if (ip === null || prefix < 0 || prefix > 32) return null

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const start = (ip & mask) >>> 0
  const size = 2 ** (32 - prefix)
  return { start, end: (start + size - 1) >>> 0 }
}

function parseExplicitRange(value: string): IpRange | null {
  const [startText, endText] = value.split('-').map((part) => part.trim())
  if (!startText || !endText) return null

  const start = parseIpv4(startText)
  const end = parseIpv4(endText)
  if (start === null || end === null || start > end) return null
  return { start, end }
}

function parseIpRange(value: string): IpRange | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.includes('/')) return parseCidrRange(trimmed)
  if (trimmed.includes('-')) return parseExplicitRange(trimmed)

  const singleIp = parseIpv4(trimmed)
  return singleIp === null ? null : { start: singleIp, end: singleIp }
}

function isAddressInRange(address: string, range: IpRange) {
  const ip = parseIpv4(address)
  return ip !== null && ip >= range.start && ip <= range.end
}

function neighborKey(neighbor: ServerNeighbor, index: number) {
  return neighbor['.id'] || `${neighborAddress(neighbor)}-${neighbor['mac-address'] ?? 'neighbor'}-${index}`
}

function NeighborCards({ neighbors }: { neighbors: ServerNeighbor[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
      {neighbors.map((neighbor, index) => {
        const href = neighborHref(neighbor)
        const title = neighbor.identity || neighborAddress(neighbor) || neighbor['mac-address'] || 'Neighbor'

        return (
          <article key={neighborKey(neighbor, index)} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-[#0b1f33]/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
                <p className="mt-1 truncate text-xs text-slate-500" dir="ltr">{neighborAddress(neighbor) || neighbor['mac-address'] || '-'}</p>
              </div>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-800"
                  aria-label="فتح العنوان"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {neighborColumns.slice(2).map((column) => (
                <div key={column.key} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="truncate font-semibold text-slate-500">{column.label}</dt>
                  <dd className="mt-1 truncate text-slate-800" dir={column.key === 'mac-address' ? 'ltr' : undefined}>{neighbor[column.key] || '-'}</dd>
                </div>
              ))}
            </dl>
          </article>
        )
      })}
    </div>
  )
}

function NeighborsTable({ neighbors }: { neighbors: ServerNeighbor[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-0 text-right text-sm tabular-nums">
        <thead>
          <tr>
            {neighborColumns.map((column) => (
              <th key={column.key} className="border-b border-slate-200 bg-slate-100/80 px-4 py-3 text-xs font-semibold text-slate-600">
                {column.label}
              </th>
            ))}
            <th className="border-b border-slate-200 bg-slate-100/80 px-4 py-3 text-xs font-semibold text-slate-600">فتح</th>
          </tr>
        </thead>
        <tbody>
          {neighbors.map((neighbor, index) => {
            const href = neighborHref(neighbor)
            return (
              <tr key={neighborKey(neighbor, index)} className="transition-colors hover:bg-cyan-50/35">
                {neighborColumns.map((column) => (
                  <td key={column.key} className={cx('border-b border-slate-100 px-4 py-3.5 text-slate-700', column.key === 'address' && 'text-left')} dir={column.key === 'address' ? 'ltr' : undefined}>
                    {neighbor[column.key] || '-'}
                  </td>
                ))}
                <td className="border-b border-slate-100 px-4 py-3.5">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-cyan-800"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      فتح
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ServerDetailView({ server, token }: { server: ManagedServer; token: string }) {
  const [neighborsResult, setNeighborsResult] = useState<ServerNeighborsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedInterface, setSelectedInterface] = useState('')
  const [ipRangeText, setIpRangeText] = useState('')
  const [mode, setMode] = useState<ViewMode>('zones')

  const loadNeighbors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setNeighborsResult(await getServerNeighbors(token, server.id))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'فشل جلب الجيران من السيرفر')
    } finally {
      setLoading(false)
    }
  }, [server.id, token])

  useEffect(() => {
    void loadNeighbors()
  }, [loadNeighbors])

  const allNeighbors = useMemo(() => neighborsResult?.result ?? [], [neighborsResult])

  const interfaceOptions = useMemo(() => {
    return Array.from(new Set(allNeighbors.map((neighbor) => interfaceName(neighbor)))).sort((a, b) => a.localeCompare(b))
  }, [allNeighbors])

  const parsedIpRange = useMemo(() => {
    const trimmed = ipRangeText.trim()
    if (!trimmed) return { range: null, error: '' }

    const range = parseIpRange(trimmed)
    return range
      ? { range, error: '' }
      : { range: null, error: 'صيغة نطاق IP غير صحيحة. استخدم 172.23.9.0/24 أو 172.23.9.1-172.23.9.254' }
  }, [ipRangeText])

  const filteredNeighbors = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allNeighbors.filter((neighbor) => {
      const address = neighbor.address || neighbor.address4 || ''
      const matchesInterface = !selectedInterface || interfaceName(neighbor) === selectedInterface
      const matchesRange = !parsedIpRange.range || isAddressInRange(address, parsedIpRange.range)

      return matchesSearch(neighbor, query) && matchesInterface && matchesRange
    })
  }, [allNeighbors, parsedIpRange.range, search, selectedInterface])

  const groupedNeighbors = useMemo(() => {
    const groups = new Map<string, ServerNeighbor[]>()
    filteredNeighbors.forEach((neighbor) => {
      const key = interfaceName(neighbor)
      groups.set(key, [...(groups.get(key) ?? []), neighbor])
    })
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredNeighbors])

  const totalCount = neighborsResult?.result.length ?? 0

  return (
    <section className="space-y-5">
      <Panel title="الجيران" description="فلترة وعرض الأجهزة المكتشفة من السيرفر.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">السيرفر</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950">{server.name}</h2>
          </div>

          <Field label="بحث">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={inputClass('pr-10')}
                placeholder="الهوية، العنوان، MAC..."
              />
            </div>
          </Field>

          <Field label="الواجهة">
            <select value={selectedInterface} onChange={(event) => setSelectedInterface(event.target.value)} className={inputClass()}>
              <option value="">كل الواجهات</option>
              {interfaceOptions.map((interfaceOption) => (
                <option key={interfaceOption} value={interfaceOption}>{interfaceOption}</option>
              ))}
            </select>
          </Field>

          <Field label="نطاق IP">
            <div>
              <input
                value={ipRangeText}
                onChange={(event) => setIpRangeText(event.target.value)}
                className={inputClass(parsedIpRange.error ? 'border-rose-300 text-left focus:border-rose-500 focus:ring-rose-100' : 'text-left')}
                dir="ltr"
                placeholder="172.23.9.0/24"
              />
              {parsedIpRange.error ? <p className="mt-1.5 text-xs text-rose-600">{parsedIpRange.error}</p> : null}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button type="button" variant={mode === 'zones' ? 'primary' : 'secondary'} icon={Layers} onClick={() => setMode('zones')} className="w-full sm:w-auto">
              حسب الواجهة
            </Button>
            <Button type="button" variant={mode === 'table' ? 'primary' : 'secondary'} icon={Table2} onClick={() => setMode('table')} className="w-full sm:w-auto">
              جدول كامل
            </Button>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusPill tone="blue">{filteredNeighbors.length} / {totalCount}</StatusPill>
            <StatusPill tone="neutral">{neighborsResult ? dateShort(neighborsResult.fetchedAt) : 'لم يتم الجلب بعد'}</StatusPill>
            <Button type="button" variant="secondary" icon={RefreshCw} loading={loading} onClick={() => void loadNeighbors()} className="min-h-9 px-3 py-1.5">
              تحديث
            </Button>
          </div>
        </div>
      </Panel>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {!loading && totalCount === 0 && !error ? (
        <EmptyState title="لا توجد بيانات جيران بعد." description="اضغط تحديث لجلب بيانات /ip/neighbor من السيرفر." icon={Server} />
      ) : null}

      {mode === 'table' && filteredNeighbors.length > 0 ? (
        <Panel title="كل الجيران" description="عرض موحد لكل الواجهات.">
          <NeighborsTable neighbors={filteredNeighbors} />
        </Panel>
      ) : null}

      {mode === 'zones' && filteredNeighbors.length > 0 ? (
        <section className="space-y-4">
          {groupedNeighbors.map(([groupName, neighbors]) => (
            <Panel
              key={groupName}
              title={groupName}
              description={`${neighbors.length} جهاز مكتشف على هذه الواجهة.`}
              actions={<ListFilter className="h-5 w-5 text-slate-400" aria-hidden="true" />}
            >
              <NeighborCards neighbors={neighbors} />
            </Panel>
          ))}
        </section>
      ) : null}

      {!loading && totalCount > 0 && filteredNeighbors.length === 0 ? (
        <EmptyState title="لا توجد نتائج مطابقة." description="غيّر كلمة البحث لعرض بيانات أكثر." icon={Search} />
      ) : null}
    </section>
  )
}
