'use client'

import { useState, type FormEvent } from 'react'
import { Check, ClipboardList, Save, X } from 'lucide-react'
import type { Currency, HoldRequest, HoldRequestItem } from '@/app/_lib/types'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import { Button, CurrencySelect, EmptyState, Field, Modal, Panel, StatusPill, TableShell, inputClass, tableClass, tdClass, thClass } from '@/app/_components/ui'
import { formatBalances, formatMoney } from '@/app/_lib/format'
import { contactName, productName } from '@/features/shared/constants/labels'
import { approveHoldRequest, rejectHoldRequest } from '../services/holdRequestsApi'

type ActionState = { type: 'approve' | 'reject'; request: HoldRequest } | null
type ApprovalItemForm = { key: string; productId: string; quantity: string; unitPrice: string; currency: Currency; note: string }

function statusLabel(status: HoldRequest['status']) {
  if (status === 'approved') return 'مقبول'
  if (status === 'rejected') return 'مرفوض'
  if (status === 'canceled') return 'ملغى'
  return 'بانتظار الموافقة'
}

function statusTone(status: HoldRequest['status']): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'danger'
  return 'neutral'
}

function requestBalances(items: HoldRequestItem[]) {
  return items.reduce<Record<Currency, number>>(
    (balances, item) => ({
      ...balances,
      [item.currency]: Number((balances[item.currency] + item.quantity * item.unitPrice).toFixed(2))
    }),
    { USD: 0, SYP: 0 }
  )
}

function requestTotal(items: HoldRequestItem[]) {
  const balances = requestBalances(items)
  const currencies = (Object.keys(balances) as Currency[]).filter((currency) => balances[currency] > 0)
  const currency = currencies[0]
  if (currencies.length === 1 && currency) return formatMoney(balances[currency], currency)
  return formatBalances(balances)
}

function toApprovalForms(request: HoldRequest): ApprovalItemForm[] {
  return request.items.map((item, index) => ({
    key: `${request.id}-${index}`,
    productId: item.productId,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    currency: item.currency,
    note: item.note
  }))
}

export function HoldRequestsView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [actionState, setActionState] = useState<ActionState>(null)
  const [adminNote, setAdminNote] = useState('')
  const [approvalItems, setApprovalItems] = useState<ApprovalItemForm[]>([])
  const pendingRequests = data.holdRequests.filter((request) => request.status === 'pending')

  function openApprove(request: HoldRequest) {
    setActionState({ type: 'approve', request })
    setAdminNote('')
    setApprovalItems(toApprovalForms(request))
  }

  function openReject(request: HoldRequest) {
    setActionState({ type: 'reject', request })
    setAdminNote('')
    setApprovalItems([])
  }

  function closeAction() {
    setActionState(null)
    setAdminNote('')
    setApprovalItems([])
  }

  function updateApprovalItem(key: string, item: Partial<ApprovalItemForm>) {
    setApprovalItems((current) => current.map((currentItem) => (currentItem.key === key ? { ...currentItem, ...item } : currentItem)))
  }

  function buildApprovalItems() {
    const requestedByProduct = new Map<string, number>()
    const items = approvalItems.map((item) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPrice)
      if (!item.productId) throw new Error('اختر المنتج لكل بند.')
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('أدخل كمية صحيحة لكل بند.')
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('أدخل سعرا صحيحا لكل بند.')
      requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) ?? 0) + quantity)
      return { productId: item.productId, quantity, unitPrice, currency: item.currency, note: item.note }
    })

    for (const [productId, quantity] of requestedByProduct.entries()) {
      const product = data.products.find((item) => item.id === productId)
      if (product && quantity > product.quantityOnHand) throw new Error(`الكمية المتوفرة من "${product.name}" غير كافية.`)
    }

    return items
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionState) return

    const { type, request } = actionState
    await mutate(`${type}-hold-request-${request.id}`, async () => {
      if (type === 'approve') {
        await approveHoldRequest(token, request.id, { adminNote, items: buildApprovalItems() })
      } else {
        await rejectHoldRequest(token, request.id, adminNote)
      }
      closeAction()
    })
  }

  function renderRequestRows(requests: HoldRequest[]) {
    return (
      <TableShell>
        <table className={`${tableClass()} min-w-[980px]`}>
          <thead>
            <tr>
              <th className={thClass()}>العامل</th>
              <th className={thClass()}>البنود</th>
              <th className={thClass()}>الإجمالي</th>
              <th className={thClass()}>الحالة</th>
              <th className={thClass()}>الملاحظة</th>
              <th className={thClass()}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td className={tdClass('min-w-44 font-semibold text-slate-950')}>{contactName(request.workerContactId, data.contacts)}</td>
                <td className={tdClass('min-w-72')}>
                  <div className="space-y-1">
                    {request.items.map((item, index) => (
                      <p key={`${request.id}-${item.productId}-${index}`} className="text-sm text-slate-700">
                        {productName(item.productId, data.products)} - {item.quantity} × {formatMoney(item.unitPrice, item.currency)}
                      </p>
                    ))}
                  </div>
                </td>
                <td className={tdClass('whitespace-nowrap font-semibold text-slate-950')}>{requestTotal(request.items)}</td>
                <td className={tdClass('whitespace-nowrap')}><StatusPill tone={statusTone(request.status)}>{statusLabel(request.status)}</StatusPill></td>
                <td className={tdClass('min-w-56')}>{request.adminNote || request.note || '-'}</td>
                <td className={tdClass('min-w-56')}>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="secondary" icon={Check} disabled={request.status !== 'pending'} loading={saving === `approve-hold-request-${request.id}`} onClick={() => openApprove(request)} className="min-h-9 px-3 py-1.5">قبول</Button>
                    <Button type="button" variant="danger" icon={X} disabled={request.status !== 'pending'} loading={saving === `reject-hold-request-${request.id}`} onClick={() => openReject(request)} className="min-h-9 px-3 py-1.5">رفض</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    )
  }

  return (
    <section className="space-y-5">
      <Modal open={Boolean(actionState)} onClose={closeAction} title={actionState?.type === 'approve' ? 'قبول طلب أمانة' : 'رفض طلب أمانة'} size="xl">
        {actionState ? (
          <form className="space-y-4" onSubmit={submitAction}>
            {actionState.type === 'approve' ? (
              <div className="space-y-3">
                {approvalItems.map((item, index) => (
                  <div key={item.key} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1.4fr_110px_130px_110px_1fr]">
                    <Field label={`المنتج ${index + 1}`}>
                      <select required value={item.productId} onChange={(event) => updateApprovalItem(item.key, { productId: event.target.value })} className={inputClass()}>
                        <option value="">اختر</option>
                        {data.products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantityOnHand})</option>)}
                      </select>
                    </Field>
                    <Field label="الكمية"><input type="number" min="1" required value={item.quantity} onChange={(event) => updateApprovalItem(item.key, { quantity: event.target.value })} className={inputClass()} /></Field>
                    <Field label="السعر"><input type="number" min="0" step="0.01" required value={item.unitPrice} onChange={(event) => updateApprovalItem(item.key, { unitPrice: event.target.value })} className={inputClass()} /></Field>
                    <Field label="العملة"><CurrencySelect value={item.currency} onChange={(currency) => updateApprovalItem(item.key, { currency })} /></Field>
                    <Field label="ملاحظة البند"><input value={item.note} onChange={(event) => updateApprovalItem(item.key, { note: event.target.value })} className={inputClass()} /></Field>
                  </div>
                ))}
              </div>
            ) : null}
            <Field label="ملاحظة الأدمن"><textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className={inputClass()} rows={3} /></Field>
            <Button loading={saving === `${actionState.type}-hold-request-${actionState.request.id}`} icon={actionState.type === 'approve' ? Save : X}>{actionState.type === 'approve' ? 'قبول وإنشاء وصل أمانة' : 'رفض الطلب'}</Button>
          </form>
        ) : null}
      </Modal>

      <Panel title="طلبات بانتظار الموافقة" description="راجع طلبات العاملين قبل إخراج البضاعة من المخزون.">
        {pendingRequests.length === 0 ? <EmptyState title="لا توجد طلبات بانتظار الموافقة." icon={ClipboardList} /> : renderRequestRows(pendingRequests)}
      </Panel>

      <Panel title="كل طلبات الأمانة" description="سجل الطلبات المقبولة والمرفوضة والملغاة.">
        {data.holdRequests.length === 0 ? <EmptyState title="لا توجد طلبات أمانة بعد." icon={ClipboardList} /> : renderRequestRows(data.holdRequests)}
      </Panel>
    </section>
  )
}
