'use client'

import { useState, type FormEvent } from 'react'
import { ClipboardList, PackageCheck, Plus, RotateCcw, Send, Trash2, WalletCards } from 'lucide-react'
import type { HoldRequest, WorkerProduct } from '@/app/_lib/types'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import { Button, EmptyState, Field, Metric, Panel, StatusPill, TableShell, inputClass, tableClass, tdClass, thClass } from '@/app/_components/ui'
import { formatBalances, formatMoney } from '@/app/_lib/format'
import { cancelHoldRequest, createHoldRequest } from '@/features/hold-requests/services/holdRequestsApi'

type RequestItemForm = { key: string; productId: string; quantity: string; note: string }

function newItem(): RequestItemForm {
  return { key: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`, productId: '', quantity: '1', note: '' }
}

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

function productName(productId: string, products: WorkerProduct[]) {
  return products.find((product) => product.id === productId)?.name || 'منتج غير معروف'
}

export function WorkerPortalView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const worker = data.currentWorker
  const availableProducts = data.workerProducts.filter((product) => product.quantityOnHand > 0)
  const [items, setItems] = useState<RequestItemForm[]>(() => [newItem()])
  const [note, setNote] = useState('')
  const pendingCount = data.holdRequests.filter((request) => request.status === 'pending').length

  function updateItem(key: string, item: Partial<RequestItemForm>) {
    setItems((current) => current.map((currentItem) => (currentItem.key === key ? { ...currentItem, ...item } : currentItem)))
  }

  function addItem() {
    setItems((current) => [...current, newItem()])
  }

  function removeItem(key: string) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.key !== key) : current))
  }

  function buildRequestItems() {
    const requestedByProduct = new Map<string, number>()
    return items.map((item) => {
      const quantity = Number(item.quantity)
      if (!item.productId) throw new Error('اختر المنتج لكل بند.')
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('أدخل كمية صحيحة لكل بند.')
      const product = data.workerProducts.find((productItem) => productItem.id === item.productId)
      requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) ?? 0) + quantity)
      if (product && (requestedByProduct.get(item.productId) ?? 0) > product.quantityOnHand) throw new Error(`الكمية المتوفرة من "${product.name}" غير كافية.`)
      return { productId: item.productId, quantity, note: item.note }
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate('create-hold-request', async () => {
      await createHoldRequest(token, { note, items: buildRequestItems() })
      setItems([newItem()])
      setNote('')
    })
  }

  async function cancelRequest(request: HoldRequest) {
    if (!window.confirm('إلغاء طلب الأمانة؟')) return
    await mutate(`cancel-hold-request-${request.id}`, () => cancelHoldRequest(token, request.id))
  }

  if (!worker) {
    return <EmptyState title="حساب العامل غير مربوط بجهة عامل." icon={PackageCheck} />
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={PackageCheck} label="البضاعة في عهدتي" value={String(worker.detail.itemsInCustody)} detail={formatBalances(worker.detail.custodyValueByCurrency)} tone="blue" />
        <Metric icon={WalletCards} label="الدين المالي" value={formatBalances(worker.detail.balancesByCurrency)} detail="بعد البيع أو تسجيل المستحقات" tone="amber" />
        <Metric icon={ClipboardList} label="طلبات بانتظار الموافقة" value={String(pendingCount)} detail="طلبات لم يوافق عليها الأدمن بعد" tone="slate" />
        <Metric icon={RotateCcw} label="التحصيل" value={formatBalances(worker.detail.collectedByCurrency)} detail="دفعات مسجلة على العامل" tone="emerald" />
      </div>

      <Panel title="طلب أمانة جديد" description="اختر المواد والكميات، وسيصل الطلب للأدمن للموافقة.">
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.key} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1.6fr_120px_1fr_44px]">
                <Field label={`المنتج ${index + 1}`}>
                  <select required value={item.productId} onChange={(event) => updateItem(item.key, { productId: event.target.value })} className={inputClass()}>
                    <option value="">اختر</option>
                    {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantityOnHand}) - {formatMoney(product.salePrice, product.currency)}</option>)}
                  </select>
                </Field>
                <Field label="الكمية"><input type="number" min="1" required value={item.quantity} onChange={(event) => updateItem(item.key, { quantity: event.target.value })} className={inputClass()} /></Field>
                <Field label="ملاحظة"><input value={item.note} onChange={(event) => updateItem(item.key, { note: event.target.value })} className={inputClass()} /></Field>
                <div className="flex items-end">
                  <Button type="button" variant="danger" icon={Trash2} disabled={items.length === 1} onClick={() => removeItem(item.key)} className="h-10 w-10 px-0" aria-label="حذف البند"><span className="sr-only">حذف</span></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" icon={Plus} onClick={addItem}>إضافة بند</Button>
            <Button loading={saving === 'create-hold-request'} icon={Send}>إرسال الطلب</Button>
          </div>
          <Field label="ملاحظة عامة"><textarea value={note} onChange={(event) => setNote(event.target.value)} className={inputClass()} rows={3} /></Field>
        </form>
      </Panel>

      <Panel title="البضاعة الموجودة لدي" description="هذه بضاعة خرجت من المخزون وأصبحت في عهدتك.">
        {worker.detail.activeHolds.length === 0 ? (
          <EmptyState title="لا توجد بضاعة في عهدتك حاليا." icon={PackageCheck} />
        ) : (
          <TableShell>
            <table className={`${tableClass()} min-w-[760px]`}>
              <thead>
                <tr>
                  <th className={thClass()}>المادة</th>
                  <th className={thClass()}>المتبقي</th>
                  <th className={thClass()}>السعر</th>
                  <th className={thClass()}>القيمة</th>
                  <th className={thClass()}>الدين</th>
                </tr>
              </thead>
              <tbody>
                {worker.detail.activeHolds.map((hold) => (
                  <tr key={hold.id}>
                    <td className={tdClass('font-semibold text-slate-950')}>{productName(hold.productId, data.workerProducts)}</td>
                    <td className={tdClass('whitespace-nowrap')}>{hold.remainingQuantity}</td>
                    <td className={tdClass('whitespace-nowrap')}>{formatMoney(hold.unitPrice, hold.currency)}</td>
                    <td className={tdClass('whitespace-nowrap')}>{formatMoney(hold.remainingQuantity * hold.unitPrice, hold.currency)}</td>
                    <td className={tdClass('whitespace-nowrap')}>{formatMoney(hold.balanceDue, hold.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </Panel>

      <Panel title="طلباتي" description="حالة طلبات الأمانة التي أرسلتها.">
        {data.holdRequests.length === 0 ? (
          <EmptyState title="لا توجد طلبات أمانة بعد." icon={ClipboardList} />
        ) : (
          <TableShell>
            <table className={`${tableClass()} min-w-[840px]`}>
              <thead>
                <tr>
                  <th className={thClass()}>البنود</th>
                  <th className={thClass()}>الحالة</th>
                  <th className={thClass()}>ملاحظة الأدمن</th>
                  <th className={thClass()}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {data.holdRequests.map((request) => (
                  <tr key={request.id}>
                    <td className={tdClass('min-w-72')}>
                      {request.items.map((item, index) => (
                        <p key={`${request.id}-${item.productId}-${index}`}>{productName(item.productId, data.workerProducts)} - {item.quantity}</p>
                      ))}
                    </td>
                    <td className={tdClass('whitespace-nowrap')}><StatusPill tone={statusTone(request.status)}>{statusLabel(request.status)}</StatusPill></td>
                    <td className={tdClass('min-w-52')}>{request.adminNote || '-'}</td>
                    <td className={tdClass('whitespace-nowrap')}>
                      <Button type="button" variant="secondary" icon={RotateCcw} disabled={request.status !== 'pending'} loading={saving === `cancel-hold-request-${request.id}`} onClick={() => cancelRequest(request)} className="min-h-9 px-3 py-1.5">إلغاء</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </Panel>
    </section>
  )
}
