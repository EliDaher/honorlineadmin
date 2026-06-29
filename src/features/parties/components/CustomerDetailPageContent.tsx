'use client'

import { CreditCard, HandCoins, Save, UsersRound, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { InventoryApp } from '@/app/_components/inventory-app'
import { apiRequest, authHeaders } from '@/app/_lib/api'
import { dateShort, formatMoney } from '@/app/_lib/format'
import type { Currency, CustomerDetail } from '@/app/_lib/types'
import { Button, CurrencySelect, EmptyState, Field, Metric, Modal, Panel, TableShell, inputClass, tableClass, tdClass, thClass } from '@/app/_components/ui'
import { useCustomers } from '../hooks/useParties'

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function statementSourceLabel(value: string) {
  const labels: Record<string, string> = {
    debt_invoice: 'فاتورة دين',
    sale: 'بيع',
    hold: 'أمانة',
    payment: 'دفعة'
  }
  return labels[value] || value
}

function CustomerFinancialDetail({
  customer,
  token,
  mutate,
  saving
}: {
  customer: CustomerDetail
  token: string
  mutate: (action: string, run: () => Promise<unknown>) => Promise<void>
  saving: string
}) {
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [invoice, setInvoice] = useState({ amount: '0', currency: 'USD' as Currency, date: todayInputValue(), note: '' })
  const [payment, setPayment] = useState({ amount: '0', currency: 'USD' as Currency, date: todayInputValue(), note: '' })
  const statement = customer.ledger.statement ?? []

  return (
    <section className="space-y-5">
      <Modal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="إضافة فاتورة دين" description="سجل مبلغ مستحق على هذا الزبون بتاريخ محاسبي محدد.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('customer-invoice', async () => {
              await apiRequest(`/api/customers/${customer.id}/debt-invoices`, {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ ...invoice, amount: Number(invoice.amount) })
              })
              setInvoice({ amount: '0', currency: 'USD', date: todayInputValue(), note: '' })
              setInvoiceOpen(false)
            })
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="المبلغ">
              <input type="number" min="0" step="0.01" value={invoice.amount} onChange={(event) => setInvoice({ ...invoice, amount: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="العملة">
              <CurrencySelect value={invoice.currency} onChange={(currency) => setInvoice({ ...invoice, currency })} />
            </Field>
          </div>
          <Field label="التاريخ">
            <input type="date" value={invoice.date} onChange={(event) => setInvoice({ ...invoice, date: event.target.value })} className={inputClass('text-left')} dir="ltr" />
          </Field>
          <Field label="التفاصيل">
            <textarea value={invoice.note} onChange={(event) => setInvoice({ ...invoice, note: event.target.value })} className={inputClass()} rows={3} />
          </Field>
          <Button loading={saving === 'customer-invoice'} icon={Save}>
            حفظ الفاتورة
          </Button>
        </form>
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="تسجيل دفعة" description="سجل دفعة مباشرة من هذا الزبون بتاريخ محاسبي محدد.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('customer-payment', async () => {
              await apiRequest('/api/payments', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({
                  targetType: 'customer',
                  targetId: customer.id,
                  customerId: customer.id,
                  amount: Number(payment.amount),
                  currency: payment.currency,
                  date: payment.date,
                  note: payment.note
                })
              })
              setPayment({ amount: '0', currency: 'USD', date: todayInputValue(), note: '' })
              setPaymentOpen(false)
            })
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="المبلغ">
              <input type="number" min="0" step="0.01" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="العملة">
              <CurrencySelect value={payment.currency} onChange={(currency) => setPayment({ ...payment, currency })} />
            </Field>
          </div>
          <Field label="التاريخ">
            <input type="date" value={payment.date} onChange={(event) => setPayment({ ...payment, date: event.target.value })} className={inputClass('text-left')} dir="ltr" />
          </Field>
          <Field label="التفاصيل">
            <textarea value={payment.note} onChange={(event) => setPayment({ ...payment, note: event.target.value })} className={inputClass()} rows={3} />
          </Field>
          <Button loading={saving === 'customer-payment'} icon={HandCoins}>
            تسجيل الدفعة
          </Button>
        </form>
      </Modal>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersRound} label="الزبون" value={customer.name} detail={customer.phone || customer.address || 'لا توجد بيانات اتصال'} tone="slate" />
        <Metric icon={WalletCards} label="الرصيد بالدولار" value={formatMoney(customer.ledger.balancesByCurrency.USD, 'USD')} detail="مدين ناقص دائن" tone={customer.ledger.balancesByCurrency.USD > 0 ? 'blue' : 'emerald'} />
        <Metric icon={WalletCards} label="الرصيد بالليرة" value={formatMoney(customer.ledger.balancesByCurrency.SYP, 'SYP')} detail="مدين ناقص دائن" tone={customer.ledger.balancesByCurrency.SYP > 0 ? 'blue' : 'emerald'} />
        <Metric icon={CreditCard} label="الحركات" value={String(statement.length)} detail={`${customer.ledger.payments.length} دفعة مسجلة`} tone="amber" />
      </section>

      <Panel
        title="كشف حساب الزبون"
        description="كل الفواتير والدفعات والمبيعات مع الرصيد الجاري."
        actions={
          <>
            <Button type="button" icon={Save} onClick={() => setInvoiceOpen(true)}>
              إضافة فاتورة دين
            </Button>
            <Button type="button" variant="secondary" icon={HandCoins} onClick={() => setPaymentOpen(true)}>
              تسجيل دفعة
            </Button>
          </>
        }
      >
        {statement.length === 0 ? (
          <EmptyState title="لا توجد حركة مالية لهذا الزبون بعد." description="أضف فاتورة دين أو سجل دفعة للبدء." icon={CreditCard} />
        ) : (
          <TableShell>
            <table className={tableClass()}>
              <thead>
                <tr>
                  <th className={thClass()}>التاريخ</th>
                  <th className={thClass()}>النوع</th>
                  <th className={thClass()}>التفاصيل</th>
                  <th className={thClass()}>مدين</th>
                  <th className={thClass()}>دائن</th>
                  <th className={thClass()}>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {statement.map((row) => (
                  <tr key={row.id}>
                    <td className={tdClass()}>{dateShort(row.date)}</td>
                    <td className={tdClass('font-semibold text-slate-950')}>{statementSourceLabel(row.sourceType)}</td>
                    <td className={tdClass()}>{row.description || '-'}</td>
                    <td className={tdClass()}>{row.debit ? formatMoney(row.debit) : '-'}</td>
                    <td className={tdClass()}>{row.credit ? formatMoney(row.credit) : '-'}</td>
                    <td className={tdClass('font-semibold text-slate-950')}>{formatMoney(row.runningBalanceByCurrency[row.currency] ?? 0, row.currency)}</td>
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

export default function CustomerDetailPageContent({ customerId }: { customerId: string }) {
  const loadViewData = useCustomers()
  return (
    <InventoryApp
      view="customers"
      loadViewData={loadViewData}
      renderView={(props) => {
        const customer = props.data.customers.find((item) => item.id === customerId)
        if (!customer) {
          return <EmptyState title="الزبون غير موجود." description="ارجع إلى قائمة الزبائن واختر زبونا موجودا." icon={UsersRound} />
        }
        return <CustomerFinancialDetail customer={customer} token={props.token} mutate={props.mutate} saving={props.saving} />
      }}
    />
  )
}
