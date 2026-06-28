'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { CreditCard, HandCoins } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { Payment } from '@/app/_lib/types'
import { Button, CurrencySelect, Field, Modal, Panel, RowActions, inputClass } from '@/app/_components/ui'
import { dateShort, formatBalances, formatMoney } from '@/app/_lib/format'
import { labelContactType, labelStatus, productName } from '@/features/shared/constants/labels'
import { SimpleRows } from '@/features/shared/components/SimpleRows'
import { createPayment, deletePayment, updatePayment, type CreatePaymentInput } from '../services/paymentsApi'

type PaymentForm = Omit<CreatePaymentInput, 'amount'> & { amount: string }
const initialForm: PaymentForm = { targetType: 'customer', targetId: '', amount: '0', currency: 'USD', customerId: '', contactId: '', note: '' }

export function PaymentsView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState(initialForm)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')

  const targetOptions = useMemo(() => {
    if (form.targetType === 'customer') return data.customers.map((customer) => ({ id: customer.id, label: customer.name, detail: formatBalances(customer.ledger.balancesByCurrency) }))
    if (form.targetType === 'contact') return data.contacts.map((contact) => ({ id: contact.id, label: contact.name, detail: labelContactType(contact.type) }))
    if (form.targetType === 'sale') return data.sales.map((sale) => ({ id: sale.id, label: productName(sale.productId, data.products), detail: `المستحق ${formatMoney(sale.balanceDue)}` }))
    return data.holds.map((hold) => ({ id: hold.id, label: productName(hold.productId, data.products), detail: `${hold.remainingQuantity} متبقي، المستحق ${formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}` }))
  }, [data, form.targetType])

  function openCreate() {
    setForm(initialForm)
    setEditingId('')
    setOpen(true)
  }

  function openEdit(payment: Payment) {
    setForm({
      targetType: payment.targetType,
      targetId: payment.targetId,
      amount: String(payment.amount.amount),
      currency: payment.amount.currency,
      customerId: payment.customerId,
      contactId: payment.contactId,
      note: payment.note
    })
    setEditingId(payment.id)
    setOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingId ? `payment-${editingId}` : 'payment', async () => {
      if (editingId) await updatePayment(token, editingId, { amount: Number(form.amount), currency: form.currency, note: form.note })
      else await createPayment(token, { ...form, amount: Number(form.amount) })
      setForm(initialForm)
      setEditingId('')
      setOpen(false)
    })
  }

  async function remove(payment: Payment) {
    if (!window.confirm(`حذف الدفعة ${formatMoney(payment.amount)}؟`)) return
    await mutate(`delete-payment-${payment.id}`, () => deletePayment(token, payment.id))
  }

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'تعديل دفعة' : 'تسجيل دفعة'} description="اختر زبوناً أو جهة أو عملية بيع أو أمانة من السجلات الحالية.">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="نوع الهدف">
            <select disabled={Boolean(editingId)} value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value as PaymentForm['targetType'], targetId: '' })} className={inputClass()}>
              <option value="customer">زبون</option>
              <option value="contact">جهة</option>
              <option value="sale">بيع</option>
              <option value="hold">أمانة</option>
            </select>
          </Field>
          <Field label="الهدف">
            <select disabled={Boolean(editingId)} required value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} className={inputClass()}>
              <option value="">اختر {labelStatus(form.targetType)}</option>
              {targetOptions.map((option) => <option key={option.id} value={option.id}>{option.label} - {option.detail}</option>)}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="المبلغ"><input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={inputClass()} /></Field>
            <Field label="العملة"><CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} /></Field>
          </div>
          <Field label="ملاحظات"><textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === (editingId ? `payment-${editingId}` : 'payment')} icon={HandCoins}>{editingId ? 'حفظ التعديل' : 'تسجيل دفعة'}</Button>
        </form>
      </Modal>

      <Panel title="سجل الدفعات" description="الدفعات المسجلة للزبائن والجهات والأمانات والمبيعات." actions={<Button type="button" icon={HandCoins} onClick={openCreate}>تسجيل دفعة</Button>}>
        <SimpleRows
          icon={CreditCard}
          rows={data.payments.map((payment) => [formatMoney(payment.amount), `${labelStatus(payment.targetType)}: ${payment.targetId}`, dateShort(payment.createdAt)])}
          actions={data.payments.map((payment) => (
            <RowActions key={payment.id} onEdit={() => openEdit(payment)} onDelete={() => remove(payment)} editLoading={saving === `payment-${payment.id}`} deleteLoading={saving === `delete-payment-${payment.id}`} />
          ))}
          empty="لا توجد دفعات بعد."
        />
      </Panel>
    </section>
  )
}
