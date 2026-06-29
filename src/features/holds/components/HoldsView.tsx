'use client'

import { useState, type FormEvent } from 'react'
import { Archive, ChevronDown, ChevronLeft, HandCoins, Plus, ReceiptText, RotateCcw, Save, ShoppingCart, Trash2 } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { Currency, Hold, HoldReceipt } from '@/app/_lib/types'
import { Button, CurrencySelect, EmptyState, Field, Modal, Panel, RowActions, StatusPill, TableShell, inputClass, tableClass, tdClass, thClass } from '@/app/_components/ui'
import { formatBalances, formatMoney } from '@/app/_lib/format'
import { contactName, productName } from '@/features/shared/constants/labels'
import {
  createHoldReceipt,
  deleteHold,
  deleteHoldReceipt,
  recordHoldPayment,
  returnHold,
  sellHold,
  sellHoldReceipt,
  updateHold,
  type CreateHoldInput,
  type CreateHoldReceiptInput,
  type UpdateHoldInput
} from '../services/holdsApi'

type HoldForm = Omit<CreateHoldInput, 'quantity' | 'unitPrice'> & { quantity: string; unitPrice: string }
type ReceiptItemForm = { key: string; productId: string; quantity: string; unitPrice: string; currency: Currency; note: string }
type ReceiptForm = { contactId: string; finalCustomerId: string; note: string; items: ReceiptItemForm[] }
type HoldAction = 'sell' | 'pay' | 'return'
type ActionState = { type: HoldAction; hold: Hold } | null
type ActionForm = { quantity: string; amount: string; discountPerUnit: string; finalCustomerId: string; note: string }
type ReceiptSellForm = { finalCustomerId: string; discountAmount: string; note: string }

const initialEditForm: HoldForm = { productId: '', contactId: '', finalCustomerId: '', quantity: '1', unitPrice: '0', currency: 'USD', note: '' }
const initialActionForm: ActionForm = { quantity: '1', amount: '', discountPerUnit: '0', finalCustomerId: '', note: '' }
const initialReceiptSellForm: ReceiptSellForm = { finalCustomerId: '', discountAmount: '0', note: '' }

function newReceiptItem(): ReceiptItemForm {
  return { key: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`, productId: '', quantity: '1', unitPrice: '0', currency: 'USD', note: '' }
}

function newReceiptForm(): ReceiptForm {
  return { contactId: '', finalCustomerId: '', note: '', items: [newReceiptItem()] }
}

function hasHoldActivity(hold: Hold) {
  return hold.quantitySold > 0 || hold.quantityReturned > 0 || hold.paidAmount > 0
}

function statusLabel(status: Hold['status']) {
  if (status === 'settled') return 'مسددة'
  if (status === 'awaiting_payment') return 'بانتظار الدفع'
  return 'نشطة'
}

function statusTone(status: Hold['status']): 'success' | 'warning' | 'blue' {
  if (status === 'settled') return 'success'
  if (status === 'awaiting_payment') return 'warning'
  return 'blue'
}

function actionLabel(type: HoldAction) {
  if (type === 'sell') return 'بيع كمية'
  if (type === 'pay') return 'تسجيل دفعة'
  return 'إرجاع للمخزون'
}

function actionSavingKey(type: HoldAction, holdId: string) {
  if (type === 'sell') return `sell-${holdId}`
  if (type === 'pay') return `pay-${holdId}`
  return `return-${holdId}`
}

function roundAmount(amount: number) {
  return Number(amount.toFixed(2))
}

function holdDiscountAmount(hold: Hold) {
  return roundAmount(hold.discountAmount ?? 0)
}

function holdGrossAmount(hold: Hold) {
  return roundAmount(hold.grossAmount ?? hold.quantitySold * hold.unitPrice)
}

function receiptRemainingRows(receipt: HoldReceipt) {
  return receipt.items
    .map((hold) => ({
      hold,
      quantity: hold.remainingQuantity,
      total: roundAmount(hold.remainingQuantity * hold.unitPrice)
    }))
    .filter((row) => row.quantity > 0)
}

function receiptRemainingCurrencies(receipt: HoldReceipt) {
  return Array.from(new Set(receiptRemainingRows(receipt).map((row) => row.hold.currency)))
}

function receiptRemainingTotal(receipt: HoldReceipt) {
  return roundAmount(receiptRemainingRows(receipt).reduce((sum, row) => sum + row.total, 0))
}

function receiptRemainingBalances(receipt: HoldReceipt) {
  return receiptRemainingRows(receipt).reduce<Record<Currency, number>>(
    (balances, row) => ({
      ...balances,
      [row.hold.currency]: roundAmount(balances[row.hold.currency] + row.total)
    }),
    { USD: 0, SYP: 0 }
  )
}

function receiptDiscountCurrency(receipt: HoldReceipt): Currency {
  return receiptRemainingCurrencies(receipt)[0] ?? 'USD'
}

export function HoldsView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const customers = data.contacts.filter((contact) => contact.type === 'customer')
  const responsible = data.contacts.filter((contact) => contact.type !== 'customer')
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(() => newReceiptForm())
  const [editForm, setEditForm] = useState(initialEditForm)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [actionState, setActionState] = useState<ActionState>(null)
  const [actionForm, setActionForm] = useState(initialActionForm)
  const [receiptSellState, setReceiptSellState] = useState<HoldReceipt | null>(null)
  const [receiptSellForm, setReceiptSellForm] = useState(initialReceiptSellForm)
  const [expandedReceipts, setExpandedReceipts] = useState<Record<string, boolean>>({})
  const editingHold = editingId ? data.holds.find((hold) => hold.id === editingId) : null
  const editingHasActivity = editingHold ? hasHoldActivity(editingHold) : false
  const editingIsReceiptItem = Boolean(editingHold?.receiptId)
  const receiptHoldIds = new Set(data.holdReceipts.flatMap((receipt) => receipt.itemIds))
  const standaloneHolds = data.holds.filter((hold) => !hold.receiptId && !receiptHoldIds.has(hold.id))

  function openCreate() {
    setReceiptForm(newReceiptForm())
    setEditForm(initialEditForm)
    setEditingId('')
    setOpen(true)
  }

  function openEdit(hold: Hold) {
    setEditForm({
      productId: hold.productId,
      contactId: hold.contactId,
      finalCustomerId: hold.finalCustomerId || '',
      quantity: String(hold.quantityHeld),
      unitPrice: String(hold.unitPrice),
      currency: hold.currency,
      note: hold.note
    })
    setEditingId(hold.id)
    setOpen(true)
  }

  function updateReceiptItem(key: string, item: Partial<ReceiptItemForm>) {
    setReceiptForm((current) => ({
      ...current,
      items: current.items.map((currentItem) => (currentItem.key === key ? { ...currentItem, ...item } : currentItem))
    }))
  }

  function selectReceiptProduct(key: string, productId: string) {
    const product = data.products.find((item) => item.id === productId)
    updateReceiptItem(key, {
      productId,
      unitPrice: product ? String(product.salePrice) : '0',
      currency: product?.currency || 'USD'
    })
  }

  function addReceiptItem() {
    setReceiptForm((current) => ({ ...current, items: [...current.items, newReceiptItem()] }))
  }

  function removeReceiptItem(key: string) {
    setReceiptForm((current) => ({ ...current, items: current.items.length > 1 ? current.items.filter((item) => item.key !== key) : current.items }))
  }

  function openAction(type: HoldAction, hold: Hold) {
    setActionState({ type, hold })
    setActionForm({
      quantity: hold.remainingQuantity > 0 ? '1' : '',
      amount: type === 'pay' && hold.balanceDue > 0 ? String(hold.balanceDue) : '',
      discountPerUnit: '0',
      finalCustomerId: hold.finalCustomerId || '',
      note: ''
    })
  }

  function closeAction() {
    setActionState(null)
    setActionForm(initialActionForm)
  }

  function openReceiptSell(receipt: HoldReceipt) {
    setReceiptSellState(receipt)
    setReceiptSellForm({
      finalCustomerId: receipt.finalCustomerId || '',
      discountAmount: '0',
      note: ''
    })
  }

  function closeReceiptSell() {
    setReceiptSellState(null)
    setReceiptSellForm(initialReceiptSellForm)
  }

  function buildReceiptInput(): CreateHoldReceiptInput {
    if (!receiptForm.contactId) throw new Error('اختر المسؤول عن الأمانة.')
    const requestedByProduct = new Map<string, number>()
    const items = receiptForm.items.map((item) => {
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPrice)
      if (!item.productId) throw new Error('اختر المنتج لكل بند.')
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('أدخل كمية صحيحة لكل بند.')
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('أدخل سعرًا صحيحًا لكل بند.')
      requestedByProduct.set(item.productId, (requestedByProduct.get(item.productId) ?? 0) + quantity)
      return { productId: item.productId, quantity, unitPrice, currency: item.currency, note: item.note }
    })

    for (const [productId, quantity] of requestedByProduct.entries()) {
      const product = data.products.find((item) => item.id === productId)
      if (product && quantity > product.quantityOnHand) throw new Error(`الكمية المتوفرة من "${product.name}" غير كافية.`)
    }

    return {
      contactId: receiptForm.contactId,
      finalCustomerId: receiptForm.finalCustomerId,
      note: receiptForm.note,
      items
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingId ? `hold-${editingId}` : 'hold-receipt', async () => {
      if (editingId) {
        const input: UpdateHoldInput = editingHasActivity
          ? { note: editForm.note }
          : editingIsReceiptItem
            ? { unitPrice: Number(editForm.unitPrice), currency: editForm.currency, note: editForm.note }
            : {
                contactId: editForm.contactId,
                finalCustomerId: editForm.finalCustomerId,
                unitPrice: Number(editForm.unitPrice),
                currency: editForm.currency,
                note: editForm.note
              }
        await updateHold(token, editingId, input)
      } else {
        await createHoldReceipt(token, buildReceiptInput())
      }
      setReceiptForm(newReceiptForm())
      setEditForm(initialEditForm)
      setEditingId('')
      setOpen(false)
    })
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionState) return

    const { type, hold } = actionState
    await mutate(actionSavingKey(type, hold.id), async () => {
      if (type === 'sell') {
        const quantity = Number(actionForm.quantity)
        const discountPerUnit = Number(actionForm.discountPerUnit || 0)
        if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('أدخل كمية بيع صحيحة.')
        if (quantity > hold.remainingQuantity) throw new Error('الكمية أكبر من الكمية المتبقية في الأمانة.')
        if (!Number.isFinite(discountPerUnit) || discountPerUnit < 0) throw new Error('أدخل حسمًا صحيحًا.')
        if (discountPerUnit > hold.unitPrice) throw new Error('الحسم أكبر من سعر الوحدة.')
        await sellHold(token, hold.id, { quantity, discountPerUnit, finalCustomerId: actionForm.finalCustomerId, note: actionForm.note })
      }

      if (type === 'pay') {
        const amount = Number(actionForm.amount)
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('أدخل مبلغ دفعة صحيح.')
        if (amount > hold.balanceDue) throw new Error('المبلغ أكبر من الرصيد المستحق.')
        await recordHoldPayment(token, hold.id, amount, hold.currency, actionForm.note)
      }

      if (type === 'return') {
        const quantity = Number(actionForm.quantity)
        if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('أدخل كمية إرجاع صحيحة.')
        if (quantity > hold.remainingQuantity) throw new Error('الكمية أكبر من الكمية المتبقية في الأمانة.')
        await returnHold(token, hold.id, quantity, actionForm.note)
      }

      closeAction()
    })
  }

  async function submitReceiptSell(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!receiptSellState) return

    const receipt = receiptSellState
    const remainingRows = receiptRemainingRows(receipt)
    const remainingTotal = receiptRemainingTotal(receipt)
    const currencies = receiptRemainingCurrencies(receipt)
    const discountAmount = Number(receiptSellForm.discountAmount || 0)

    if (remainingRows.length === 0) throw new Error('لا توجد كميات متبقية للبيع في هذا الوصل.')
    if (!Number.isFinite(discountAmount) || discountAmount < 0) throw new Error('أدخل حسمًا صحيحًا.')
    if (discountAmount > remainingTotal) throw new Error('الحسم أكبر من إجمالي الوصل.')
    if (discountAmount > 0 && currencies.length > 1) throw new Error('لا يمكن تطبيق حسم واحد على وصل فيه أكثر من عملة.')

    await mutate(`sell-receipt-${receipt.id}`, async () => {
      await sellHoldReceipt(token, receipt.id, {
        finalCustomerId: receiptSellForm.finalCustomerId,
        discountAmount,
        note: receiptSellForm.note
      })
      closeReceiptSell()
    })
  }

  async function remove(hold: Hold) {
    const label = hold.receiptId ? 'بند الأمانة' : 'الأمانة'
    if (!window.confirm(`حذف ${label} "${productName(hold.productId, data.products)}"؟`)) return
    await mutate(`delete-hold-${hold.id}`, () => deleteHold(token, hold.id))
  }

  async function removeReceipt(receipt: HoldReceipt) {
    if (!window.confirm(`حذف وصل الأمانة "${receipt.receiptNumber}" وكل بنوده؟`)) return
    await mutate(`delete-receipt-${receipt.id}`, () => deleteHoldReceipt(token, receipt.id))
  }

  function toggleReceipt(receiptId: string) {
    setExpandedReceipts((current) => ({ ...current, [receiptId]: !(current[receiptId] ?? true) }))
  }

  function renderHoldsTable(holds: Hold[], showParties = false) {
    return (
      <TableShell>
        <table className={`${tableClass()} min-w-[1180px]`}>
          <thead>
            <tr>
              <th className={thClass()}>المادة</th>
              {showParties ? <th className={thClass()}>المسؤول</th> : null}
              {showParties ? <th className={thClass()}>الزبون</th> : null}
              <th className={thClass()}>الكمية</th>
              <th className={thClass()}>المباع</th>
              <th className={thClass()}>المرتجع</th>
              <th className={thClass()}>المتبقي</th>
              <th className={thClass()}>المدفوع</th>
              <th className={thClass()}>المستحق</th>
              <th className={thClass()}>الحالة</th>
              <th className={thClass()}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {holds.map((hold) => {
              const canMoveQuantity = hold.remainingQuantity > 0
              const canPay = hold.balanceDue > 0
              const canDelete = !hasHoldActivity(hold)

              return (
                <tr key={hold.id}>
                  <td className={tdClass('min-w-56')}>
                    <p className="font-semibold text-slate-950">{productName(hold.productId, data.products)}</p>
                    {holdDiscountAmount(hold) > 0 ? <p className="text-xs text-emerald-700">حسم {formatMoney(holdDiscountAmount(hold), hold.currency)} من {formatMoney(holdGrossAmount(hold), hold.currency)}</p> : null}
                    <p className="text-xs text-slate-500">{formatMoney(hold.unitPrice, hold.currency)} للوحدة</p>
                  </td>
                  {showParties ? <td className={tdClass('min-w-40')}>{contactName(hold.contactId, data.contacts)}</td> : null}
                  {showParties ? <td className={tdClass('min-w-40')}>{contactName(hold.finalCustomerId || '', data.contacts)}</td> : null}
                  <td className={tdClass('whitespace-nowrap font-semibold text-slate-950')}>{hold.quantityHeld}</td>
                  <td className={tdClass('whitespace-nowrap')}>{hold.quantitySold}</td>
                  <td className={tdClass('whitespace-nowrap')}>{hold.quantityReturned}</td>
                  <td className={tdClass('whitespace-nowrap font-semibold text-slate-950')}>{hold.remainingQuantity}</td>
                  <td className={tdClass('whitespace-nowrap')}>{formatMoney(hold.paidAmount, hold.currency)}</td>
                  <td className={tdClass('whitespace-nowrap')}>{formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}</td>
                  <td className={tdClass('whitespace-nowrap')}><StatusPill tone={statusTone(hold.status)}>{statusLabel(hold.status)}</StatusPill></td>
                  <td className={tdClass('min-w-[420px]')}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="secondary" icon={ShoppingCart} disabled={!canMoveQuantity} loading={saving === `sell-${hold.id}`} onClick={() => openAction('sell', hold)} className="min-h-9 px-3 py-1.5">بيع</Button>
                      <Button type="button" variant="secondary" icon={HandCoins} disabled={!canPay} loading={saving === `pay-${hold.id}`} onClick={() => openAction('pay', hold)} className="min-h-9 px-3 py-1.5">دفع</Button>
                      <Button type="button" variant="secondary" icon={RotateCcw} disabled={!canMoveQuantity} loading={saving === `return-${hold.id}`} onClick={() => openAction('return', hold)} className="min-h-9 px-3 py-1.5">إرجاع</Button>
                      <RowActions onEdit={() => openEdit(hold)} onDelete={() => remove(hold)} editLoading={saving === `hold-${hold.id}`} deleteLoading={saving === `delete-hold-${hold.id}`} deleteDisabled={!canDelete} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableShell>
    )
  }

  const actionIcon = actionState?.type === 'pay' ? HandCoins : actionState?.type === 'return' ? RotateCcw : ShoppingCart
  const actionQuantity = Number(actionForm.quantity || 0)
  const actionDiscountPerUnit = Number(actionForm.discountPerUnit || 0)
  const actionGrossAmount = actionState?.type === 'sell' ? roundAmount((Number.isFinite(actionQuantity) ? actionQuantity : 0) * actionState.hold.unitPrice) : 0
  const actionDiscountAmount = actionState?.type === 'sell' ? roundAmount((Number.isFinite(actionQuantity) ? actionQuantity : 0) * (Number.isFinite(actionDiscountPerUnit) ? actionDiscountPerUnit : 0)) : 0
  const actionNetAmount = Math.max(0, roundAmount(actionGrossAmount - actionDiscountAmount))
  const receiptSellRemainingTotal = receiptSellState ? receiptRemainingTotal(receiptSellState) : 0
  const receiptSellDiscount = Number(receiptSellForm.discountAmount || 0)
  const receiptSellNetTotal = Math.max(0, roundAmount(receiptSellRemainingTotal - (Number.isFinite(receiptSellDiscount) ? receiptSellDiscount : 0)))
  const receiptSellCurrencies = receiptSellState ? receiptRemainingCurrencies(receiptSellState) : []
  const receiptSellBalances = receiptSellState ? receiptRemainingBalances(receiptSellState) : { USD: 0, SYP: 0 }
  const receiptSellCurrency = receiptSellState ? receiptDiscountCurrency(receiptSellState) : 'USD'
  const receiptSellTotalText = receiptSellCurrencies.length > 1 ? formatBalances(receiptSellBalances) : formatMoney(receiptSellRemainingTotal, receiptSellCurrency)
  const receiptSellDiscountText = receiptSellCurrencies.length > 1 ? formatMoney(0, receiptSellCurrency) : formatMoney(Number.isFinite(receiptSellDiscount) ? receiptSellDiscount : 0, receiptSellCurrency)
  const receiptSellNetText = receiptSellCurrencies.length > 1 ? formatBalances(receiptSellBalances) : formatMoney(receiptSellNetTotal, receiptSellCurrency)
  const hasAnyHolds = data.holdReceipts.length > 0 || standaloneHolds.length > 0

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'تعديل بند أمانة' : 'إنشاء وصل أمانة'} description={editingId ? 'عدّل بيانات البند قبل وجود حركة عليه، أو ملاحظاته بعد الحركة.' : 'أضف منتجًا أو أكثر في وصل أمانة واحد.'} size="xl">
        <form className="space-y-4" onSubmit={submit}>
          {editingId ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="المسؤول">
                  <select required disabled={editingHasActivity || editingIsReceiptItem} value={editForm.contactId} onChange={(event) => setEditForm({ ...editForm, contactId: event.target.value })} className={inputClass()}>
                    <option value="">اختر</option>
                    {responsible.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                  </select>
                </Field>
                <Field label="الزبون">
                  <select disabled={editingHasActivity || editingIsReceiptItem} value={editForm.finalCustomerId} onChange={(event) => setEditForm({ ...editForm, finalCustomerId: event.target.value })} className={inputClass()}>
                    <option value="">اختياري</option>
                    {customers.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="السعر"><input type="number" min="0" step="0.01" required disabled={editingHasActivity} value={editForm.unitPrice} onChange={(event) => setEditForm({ ...editForm, unitPrice: event.target.value })} className={inputClass()} /></Field>
                <Field label="العملة"><CurrencySelect value={editForm.currency} disabled={editingHasActivity} onChange={(currency) => setEditForm({ ...editForm, currency })} /></Field>
              </div>
              <Field label="ملاحظات"><textarea value={editForm.note} onChange={(event) => setEditForm({ ...editForm, note: event.target.value })} className={inputClass()} rows={3} /></Field>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="المسؤول">
                  <select required value={receiptForm.contactId} onChange={(event) => setReceiptForm({ ...receiptForm, contactId: event.target.value })} className={inputClass()}>
                    <option value="">اختر</option>
                    {responsible.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                  </select>
                </Field>
                <Field label="الزبون">
                  <select value={receiptForm.finalCustomerId} onChange={(event) => setReceiptForm({ ...receiptForm, finalCustomerId: event.target.value })} className={inputClass()}>
                    <option value="">اختياري</option>
                    {customers.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                  </select>
                </Field>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {receiptForm.items.map((item, index) => (
                  <div key={item.key} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-[1.5fr_110px_120px_110px_1fr_44px]">
                    <Field label={`المنتج ${index + 1}`}>
                      <select required value={item.productId} onChange={(event) => selectReceiptProduct(item.key, event.target.value)} className={inputClass()}>
                        <option value="">اختر</option>
                        {data.products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantityOnHand})</option>)}
                      </select>
                    </Field>
                    <Field label="الكمية"><input type="number" min="1" required value={item.quantity} onChange={(event) => updateReceiptItem(item.key, { quantity: event.target.value })} className={inputClass()} /></Field>
                    <Field label="السعر"><input type="number" min="0" step="0.01" required value={item.unitPrice} onChange={(event) => updateReceiptItem(item.key, { unitPrice: event.target.value })} className={inputClass()} /></Field>
                    <Field label="العملة"><CurrencySelect value={item.currency} onChange={(currency) => updateReceiptItem(item.key, { currency })} /></Field>
                    <Field label="ملاحظات"><input value={item.note} onChange={(event) => updateReceiptItem(item.key, { note: event.target.value })} className={inputClass()} /></Field>
                    <div className="flex items-end">
                      <Button type="button" variant="danger" icon={Trash2} onClick={() => removeReceiptItem(item.key)} disabled={receiptForm.items.length === 1} className="h-10 w-10 px-0" aria-label="حذف البند">
                        <span className="sr-only">حذف</span>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="secondary" icon={Plus} onClick={addReceiptItem}>إضافة بند</Button>
              </div>
              <Field label="ملاحظات الوصل"><textarea value={receiptForm.note} onChange={(event) => setReceiptForm({ ...receiptForm, note: event.target.value })} className={inputClass()} rows={3} /></Field>
            </>
          )}
          <Button loading={saving === (editingId ? `hold-${editingId}` : 'hold-receipt')} icon={Save}>{editingId ? 'حفظ التعديل' : 'إنشاء وصل أمانة'}</Button>
        </form>
      </Modal>

      <Modal open={Boolean(actionState)} onClose={closeAction} title={actionState ? actionLabel(actionState.type) : ''} description={actionState ? productName(actionState.hold.productId, data.products) : undefined}>
        {actionState ? (
          <form className="space-y-4" onSubmit={submitAction}>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              المتبقي {actionState.hold.remainingQuantity}، المستحق {formatMoney(actionState.hold.balanceDueMoney || actionState.hold.balanceDue, actionState.hold.currency)}
            </p>
            {actionState.type !== 'pay' ? (
              <Field label="الكمية">
                <input type="number" min="1" max={actionState.hold.remainingQuantity} required value={actionForm.quantity} onChange={(event) => setActionForm({ ...actionForm, quantity: event.target.value })} className={inputClass()} />
              </Field>
            ) : (
              <Field label="المبلغ">
                <input type="number" min="0.01" max={actionState.hold.balanceDue} step="0.01" required value={actionForm.amount} onChange={(event) => setActionForm({ ...actionForm, amount: event.target.value })} className={inputClass()} />
              </Field>
            )}
            {actionState.type === 'sell' ? (
              <>
                <Field label="حسم الوحدة">
                  <input type="number" min="0" max={actionState.hold.unitPrice} step="0.01" value={actionForm.discountPerUnit} onChange={(event) => setActionForm({ ...actionForm, discountPerUnit: event.target.value })} className={inputClass()} />
                </Field>
                <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:grid-cols-3">
                  <span>الإجمالي {formatMoney(actionGrossAmount, actionState.hold.currency)}</span>
                  <span>الحسم {formatMoney(actionDiscountAmount, actionState.hold.currency)}</span>
                  <span className="font-semibold text-slate-950">الصافي {formatMoney(actionNetAmount, actionState.hold.currency)}</span>
                </div>
              </>
            ) : null}
            {actionState.type === 'sell' ? (
              <Field label="الزبون النهائي">
                <select value={actionForm.finalCustomerId} onChange={(event) => setActionForm({ ...actionForm, finalCustomerId: event.target.value })} className={inputClass()}>
                  <option value="">بدون</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                </select>
              </Field>
            ) : null}
            <Field label="ملاحظات"><textarea value={actionForm.note} onChange={(event) => setActionForm({ ...actionForm, note: event.target.value })} className={inputClass()} rows={3} /></Field>
            <Button loading={saving === actionSavingKey(actionState.type, actionState.hold.id)} icon={actionIcon}>{actionLabel(actionState.type)}</Button>
          </form>
        ) : null}
      </Modal>

      <Modal open={Boolean(receiptSellState)} onClose={closeReceiptSell} title="بيع الوصل" description={receiptSellState?.receiptNumber}>
        {receiptSellState ? (
          <form className="space-y-4" onSubmit={submitReceiptSell}>
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:grid-cols-3">
              <span>الإجمالي {receiptSellTotalText}</span>
              <span>الحسم {receiptSellDiscountText}</span>
              <span className="font-semibold text-slate-950">الصافي {receiptSellNetText}</span>
            </div>
            {receiptSellCurrencies.length > 1 ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">لا يمكن تطبيق حسم واحد على وصل فيه أكثر من عملة.</p> : null}
            <Field label="الحسم على الوصل">
              <input type="number" min="0" max={receiptSellRemainingTotal} step="0.01" disabled={receiptSellCurrencies.length > 1} value={receiptSellForm.discountAmount} onChange={(event) => setReceiptSellForm({ ...receiptSellForm, discountAmount: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="الزبون النهائي">
              <select value={receiptSellForm.finalCustomerId} onChange={(event) => setReceiptSellForm({ ...receiptSellForm, finalCustomerId: event.target.value })} className={inputClass()}>
                <option value="">بدون</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </Field>
            <Field label="ملاحظات"><textarea value={receiptSellForm.note} onChange={(event) => setReceiptSellForm({ ...receiptSellForm, note: event.target.value })} className={inputClass()} rows={3} /></Field>
            <Button loading={saving === `sell-receipt-${receiptSellState.id}`} icon={ShoppingCart}>بيع الوصل</Button>
          </form>
        ) : null}
      </Modal>

      <Panel title="الأمانات" description="وصول الأمانات متعددة البنود وإجراءات البيع والدفع والإرجاع لكل بند." actions={<Button type="button" icon={ReceiptText} onClick={openCreate}>إنشاء وصل أمانة</Button>}>
        {!hasAnyHolds ? (
          <EmptyState title="لا توجد أمانات بعد." description="أنشئ أول وصل أمانة لإضافة منتج أو أكثر إلى جهة مسؤولة." icon={Archive} />
        ) : (
          <div className="space-y-4">
            {data.holdReceipts.map((receipt) => {
              const expanded = expandedReceipts[receipt.id] ?? true
              const canDeleteReceipt = receipt.items.every((hold) => !hasHoldActivity(hold))
              const canSellReceipt = receipt.remainingQuantity > 0

              return (
                <section key={receipt.id} className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="flex flex-col gap-3 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{receipt.receiptNumber}</p>
                        <StatusPill tone={statusTone(receipt.status)}>{statusLabel(receipt.status)}</StatusPill>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {contactName(receipt.contactId, data.contacts)} / {contactName(receipt.finalCustomerId || '', data.contacts)} - {receipt.itemCount} بنود - المتبقي {receipt.remainingQuantity} - المستحق {formatBalances(receipt.balancesDue)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="secondary" icon={ShoppingCart} disabled={!canSellReceipt} loading={saving === `sell-receipt-${receipt.id}`} onClick={() => openReceiptSell(receipt)}>بيع الوصل</Button>
                      <Button type="button" variant="secondary" icon={expanded ? ChevronDown : ChevronLeft} onClick={() => toggleReceipt(receipt.id)}>{expanded ? 'إخفاء البنود' : 'عرض البنود'}</Button>
                      <Button type="button" variant="danger" icon={Trash2} disabled={!canDeleteReceipt} loading={saving === `delete-receipt-${receipt.id}`} onClick={() => removeReceipt(receipt)}>حذف الوصل</Button>
                    </div>
                  </div>
                  {expanded ? <div className="p-4">{renderHoldsTable(receipt.items)}</div> : null}
                </section>
              )
            })}

            {standaloneHolds.length > 0 ? (
              <section className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-950">أمانات قديمة بدون وصل</p>
                  <p className="mt-1 text-sm text-slate-600">هذه بنود أنشئت قبل نظام وصول الأمانات، وتبقى قابلة للبيع والدفع والإرجاع.</p>
                </div>
                <div className="p-4">{renderHoldsTable(standaloneHolds, true)}</div>
              </section>
            ) : null}
          </div>
        )}
      </Panel>
    </section>
  )
}
