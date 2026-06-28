'use client'

import { useState, type FormEvent } from 'react'
import { CircleDollarSign, HandCoins, PackagePlus, ReceiptText, RefreshCw, Save, ShoppingBag, WalletCards, Warehouse } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { AccountingExpense, AccountingPurchase } from '@/app/_lib/types'
import { Button, CurrencySelect, Field, Metric, Modal, Panel, RowActions, cx, inputClass } from '@/app/_components/ui'
import { dateShort, formatBalances, formatMoney } from '@/app/_lib/format'
import { contactName, labelStatus, productName } from '@/features/shared/constants/labels'
import { SimpleRows } from '@/features/shared/components/SimpleRows'
import {
  backfillAccountingEntries,
  createExpense,
  createPurchase,
  deleteExpense,
  deletePurchase,
  updateExpense,
  updatePurchase,
  type CreateExpenseInput,
  type CreatePurchaseInput
} from '../services/accountingApi'
import { BalanceSheetView, ProfitAndLossView } from './FinancialStatements'
import { JournalLedgerView } from './JournalLedgerView'

type ExpenseForm = Omit<CreateExpenseInput, 'amount'> & { amount: string }
type PurchaseForm = Omit<CreatePurchaseInput, 'quantity' | 'unitCost'> & { quantity: string; unitCost: string }

const initialExpense: ExpenseForm = { category: 'مصروف تشغيلي', vendorContactId: '', amount: '0', currency: 'USD', paidStatus: 'paid', note: '' }
const initialPurchase: PurchaseForm = { productId: '', supplierContactId: '', quantity: '1', unitCost: '0', currency: 'USD', paidStatus: 'paid', note: '' }

export function AccountingView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [tab, setTab] = useState<'pl' | 'balance' | 'ledger'>('pl')
  const [expense, setExpense] = useState(initialExpense)
  const [purchase, setPurchase] = useState(initialPurchase)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState('')
  const [editingPurchaseId, setEditingPurchaseId] = useState('')
  const dashboard = data.accountingDashboard
  const statements = data.financialStatements
  const metrics = dashboard?.metrics

  function openCreateExpense() {
    setExpense(initialExpense)
    setEditingExpenseId('')
    setExpenseOpen(true)
  }

  function openEditExpense(item: AccountingExpense) {
    setExpense({ category: item.category, vendorContactId: item.vendorContactId, amount: String(item.amount.amount), currency: item.amount.currency, paidStatus: item.paidStatus, note: item.note })
    setEditingExpenseId(item.id)
    setExpenseOpen(true)
  }

  function openCreatePurchase() {
    setPurchase(initialPurchase)
    setEditingPurchaseId('')
    setPurchaseOpen(true)
  }

  function openEditPurchase(item: AccountingPurchase) {
    setPurchase({ productId: item.productId, supplierContactId: item.supplierContactId, quantity: String(item.quantity), unitCost: String(item.unitCost.amount), currency: item.unitCost.currency, paidStatus: item.paidStatus, note: item.note })
    setEditingPurchaseId(item.id)
    setPurchaseOpen(true)
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingExpenseId ? `expense-${editingExpenseId}` : 'expense', async () => {
      const payload = { ...expense, amount: Number(expense.amount) }
      if (editingExpenseId) await updateExpense(token, editingExpenseId, payload)
      else await createExpense(token, payload)
      setExpense(initialExpense)
      setEditingExpenseId('')
      setExpenseOpen(false)
    })
  }

  async function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingPurchaseId ? `purchase-${editingPurchaseId}` : 'purchase', async () => {
      const payload = { ...purchase, quantity: Number(purchase.quantity), unitCost: Number(purchase.unitCost) }
      if (editingPurchaseId) await updatePurchase(token, editingPurchaseId, payload)
      else await createPurchase(token, payload)
      setPurchase(initialPurchase)
      setEditingPurchaseId('')
      setPurchaseOpen(false)
    })
  }

  async function removeExpense(item: AccountingExpense) {
    if (!window.confirm(`حذف المصروف "${item.category}"؟`)) return
    await mutate(`delete-expense-${item.id}`, () => deleteExpense(token, item.id))
  }

  async function removePurchase(item: AccountingPurchase) {
    if (!window.confirm(`حذف شراء "${productName(item.productId, data.products)}"؟`)) return
    await mutate(`delete-purchase-${item.id}`, () => deletePurchase(token, item.id))
  }

  return (
    <section className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={WalletCards} label="النقدية" value={formatBalances(metrics?.cash)} detail={`${dashboard?.counts.journalEntries ?? 0} قيد محاسبي`} tone="emerald" />
        <Metric icon={CircleDollarSign} label="الذمم المدينة" value={formatBalances(metrics?.receivables)} detail="أرصدة الزبائن المفتوحة" tone="blue" />
        <Metric icon={Warehouse} label="قيمة المخزون" value={formatBalances(metrics?.inventory)} detail="المخزون بالتكلفة" tone="slate" />
        <Metric icon={HandCoins} label="صافي الربح" value={formatBalances(metrics?.netProfit)} detail={`المصاريف ${formatBalances(metrics?.expenses)}`} tone={(metrics?.netProfit.USD ?? 0) < 0 || (metrics?.netProfit.SYP ?? 0) < 0 ? 'amber' : 'emerald'} />
      </section>

      <Modal open={expenseOpen} onClose={() => setExpenseOpen(false)} title={editingExpenseId ? 'تعديل مصروف' : 'تسجيل مصروف'} description="رحّل المصاريف التشغيلية إلى دفتر المحاسبة.">
        <form className="space-y-4" onSubmit={submitExpense}>
          <Field label="التصنيف"><input required value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} className={inputClass()} /></Field>
          <Field label="المورد"><select value={expense.vendorContactId} onChange={(event) => setExpense({ ...expense, vendorContactId: event.target.value })} className={inputClass()}><option value="">بدون</option>{data.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="المبلغ"><input type="number" min="0" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} className={inputClass()} /></Field>
            <Field label="العملة"><CurrencySelect value={expense.currency} onChange={(currency) => setExpense({ ...expense, currency })} /></Field>
          </div>
          <Field label="الحالة"><select value={expense.paidStatus} onChange={(event) => setExpense({ ...expense, paidStatus: event.target.value as ExpenseForm['paidStatus'] })} className={inputClass()}><option value="paid">مدفوع</option><option value="unpaid">غير مدفوع</option></select></Field>
          <Field label="ملاحظات"><textarea value={expense.note} onChange={(event) => setExpense({ ...expense, note: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === (editingExpenseId ? `expense-${editingExpenseId}` : 'expense')} icon={Save}>{editingExpenseId ? 'حفظ التعديل' : 'تسجيل مصروف'}</Button>
        </form>
      </Modal>

      <Modal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} title={editingPurchaseId ? 'تعديل شراء مخزون' : 'تسجيل شراء مخزون'} description="زد المخزون ورحّل النقدية أو الذمم الدائنة." size="lg">
        <form className="space-y-4" onSubmit={submitPurchase}>
          <Field label="المنتج"><select disabled={Boolean(editingPurchaseId)} required value={purchase.productId} onChange={(event) => { const product = data.products.find((item) => item.id === event.target.value); setPurchase({ ...purchase, productId: event.target.value, unitCost: product ? String(product.costPrice) : purchase.unitCost, currency: product?.currency || purchase.currency }) }} className={inputClass()}><option value="">اختر المنتج</option>{data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
          <Field label="المورد"><select value={purchase.supplierContactId} onChange={(event) => setPurchase({ ...purchase, supplierContactId: event.target.value })} className={inputClass()}><option value="">بدون</option>{data.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الكمية"><input type="number" min="0" step="0.01" value={purchase.quantity} onChange={(event) => setPurchase({ ...purchase, quantity: event.target.value })} className={inputClass()} /></Field>
            <Field label="تكلفة الوحدة"><input type="number" min="0" step="0.01" value={purchase.unitCost} onChange={(event) => setPurchase({ ...purchase, unitCost: event.target.value })} className={inputClass()} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="العملة"><CurrencySelect value={purchase.currency} onChange={(currency) => setPurchase({ ...purchase, currency })} /></Field>
            <Field label="الحالة"><select value={purchase.paidStatus} onChange={(event) => setPurchase({ ...purchase, paidStatus: event.target.value as PurchaseForm['paidStatus'] })} className={inputClass()}><option value="paid">مدفوع</option><option value="unpaid">غير مدفوع</option></select></Field>
          </div>
          <Field label="ملاحظات"><textarea value={purchase.note} onChange={(event) => setPurchase({ ...purchase, note: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === (editingPurchaseId ? `purchase-${editingPurchaseId}` : 'purchase')} icon={PackagePlus}>{editingPurchaseId ? 'حفظ التعديل' : 'تسجيل شراء'}</Button>
        </form>
      </Modal>

      <Panel title="القوائم المالية" description={`تم التوليد ${dateShort(statements?.generatedAt)}`} actions={<><Button type="button" icon={Save} onClick={openCreateExpense}>تسجيل مصروف</Button><Button type="button" variant="secondary" icon={PackagePlus} onClick={openCreatePurchase}>تسجيل شراء</Button><Button type="button" variant="secondary" icon={RefreshCw} loading={saving === 'backfill'} onClick={() => mutate('backfill', () => backfillAccountingEntries(token))}>ترحيل التاريخ</Button></>}>
        <div className="mb-4 flex flex-wrap gap-2">{([['pl', 'الأرباح والخسائر'], ['balance', 'الميزانية العمومية'], ['ledger', 'دفتر القيود']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={cx('rounded-lg border px-3 py-2 text-sm font-semibold transition', tab === key ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700')}>{label}</button>)}</div>
        {tab === 'pl' ? <ProfitAndLossView statements={statements} /> : null}
        {tab === 'balance' ? <BalanceSheetView statements={statements} /> : null}
        {tab === 'ledger' ? <JournalLedgerView entries={data.journalEntries} contacts={data.contacts} /> : null}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="المصروفات" description="المصاريف التشغيلية المسجلة.">
          <SimpleRows
            icon={ReceiptText}
            rows={data.expenses.map((item) => [item.category, formatMoney(item.amount), `${labelStatus(item.paidStatus)} - ${contactName(item.vendorContactId, data.contacts)}`])}
            actions={data.expenses.map((item) => (
              <RowActions key={item.id} onEdit={() => openEditExpense(item)} onDelete={() => removeExpense(item)} editLoading={saving === `expense-${item.id}`} deleteLoading={saving === `delete-expense-${item.id}`} />
            ))}
            empty="لا توجد مصروفات بعد."
          />
        </Panel>

        <Panel title="المشتريات" description="عمليات شراء المخزون المسجلة.">
          <SimpleRows
            icon={ShoppingBag}
            rows={data.purchases.map((item) => [productName(item.productId, data.products), `${item.quantity} × ${formatMoney(item.unitCost)}`, `${formatMoney(item.total)} - ${labelStatus(item.paidStatus)}`])}
            actions={data.purchases.map((item) => (
              <RowActions key={item.id} onEdit={() => openEditPurchase(item)} onDelete={() => removePurchase(item)} editLoading={saving === `purchase-${item.id}`} deleteLoading={saving === `delete-purchase-${item.id}`} />
            ))}
            empty="لا توجد مشتريات بعد."
          />
        </Panel>
      </div>
    </section>
  )
}
