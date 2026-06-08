'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  Archive,
  Boxes,
  Cable,
  CheckCircle2,
  CircleDollarSign,
  ContactRound,
  CreditCard,
  FolderTree,
  HandCoins,
  LayoutDashboard,
  Loader2,
  LogOut,
  PackagePlus,
  RefreshCw,
  Save,
  Scissors,
  ShieldCheck,
  ShoppingCart,
  Tags,
  UserRound,
  UsersRound,
  Warehouse,
  WalletCards
} from 'lucide-react'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest, authHeaders, login, TOKEN_STORAGE_KEY } from '../_lib/api'
import { dateShort, formatBalances, formatMoney } from '../_lib/format'
import type {
  AccountingAccount,
  AccountingDashboard,
  AccountBalance,
  ApiResponse,
  CableCut,
  CableRoll,
  Category,
  Contact,
  ContactType,
  Currency,
  CustomerDetail,
  FinancialStatements,
  Hold,
  InventoryData,
  InventorySummary,
  JournalEntry,
  Payment,
  Product,
  Sale,
  User,
  ViewKey,
  WorkerDetail
} from '../_lib/types'
import {
  Alert,
  Button,
  CurrencySelect,
  EmptyState,
  Field,
  Metric,
  Modal,
  Panel,
  StatusPill,
  TableShell,
  cx,
  inputClass,
  tableClass,
  tdClass,
  thClass
} from './ui'

const routes = [
  { key: 'dashboard', label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'المنتجات', href: '/products', icon: Boxes },
  { key: 'categories', label: 'التصنيفات', href: '/categories', icon: FolderTree },
  { key: 'contacts', label: 'الجهات', href: '/contacts', icon: ContactRound },
  { key: 'workers', label: 'العاملون', href: '/workers', icon: ShieldCheck },
  { key: 'customers', label: 'الزبائن', href: '/customers', icon: UsersRound },
  { key: 'holds', label: 'الأمانات', href: '/holds', icon: Archive },
  { key: 'sales', label: 'المبيعات', href: '/sales', icon: ShoppingCart },
  { key: 'payments', label: 'الدفعات', href: '/payments', icon: CreditCard },
  { key: 'accounting', label: 'المحاسبة', href: '/accounting', icon: CircleDollarSign },
  { key: 'cables', label: 'الكابلات', href: '/cables', icon: Cable }
] satisfies Array<{ key: ViewKey; label: string; href: string; icon: typeof LayoutDashboard }>

const contactTypeLabels: Record<ContactType, string> = {
  dealer: 'تاجر',
  customer: 'زبون',
  worker: 'عامل',
  supplier: 'مورد'
}

const statusLabels: Record<string, string> = {
  active: 'نشط',
  awaiting_payment: 'بانتظار الدفع',
  settled: 'مسدد',
  unpaid: 'غير مدفوع',
  partial: 'مدفوع جزئيا',
  paid: 'مدفوع',
  sale: 'بيع',
  hold: 'أمانة',
  customer: 'زبون',
  contact: 'جهة',
  use: 'استخدام داخلي',
  expense: 'مصروف',
  purchase: 'شراء',
  product: 'منتج',
  payment: 'دفعة',
  cable_sale: 'بيع كابل',
  cable_roll: 'رول كابل',
  balanced: 'متوازن',
  unbalanced: 'غير متوازن'
}

const accountNameLabels: Record<string, string> = {
  Cash: 'النقدية',
  'Accounts Receivable': 'الذمم المدينة',
  Inventory: 'المخزون',
  'Accounts Payable': 'الذمم الدائنة',
  'Opening Balance Equity': 'حقوق الملكية الافتتاحية',
  'Sales Revenue': 'إيرادات المبيعات',
  'Cost of Goods Sold': 'تكلفة البضاعة المباعة',
  'Operating Expenses': 'المصاريف التشغيلية'
}

const memoLabels: Record<string, string> = {
  'Sale recorded': 'تم تسجيل بيع',
  'Payment received': 'تم استلام دفعة',
  'Initial product inventory value': 'قيمة مخزون افتتاحية للمنتج',
  'Direct product sale': 'بيع مباشر',
  'Hold sale settled': 'تسوية بيع أمانة',
  'Hold payment': 'دفعة أمانة',
  'Sale payment': 'دفعة بيع',
  'Direct payment': 'دفعة مباشرة',
  'Cable sale': 'بيع كابل',
  'Opening cable roll value': 'قيمة افتتاحية لرول كابل',
  'Stock purchase': 'شراء مخزون'
}

const emptyData: InventoryData = {
  summary: null,
  products: [],
  categories: [],
  contacts: [],
  workers: [],
  customers: [],
  holds: [],
  sales: [],
  payments: [],
  accountingDashboard: null,
  financialStatements: null,
  journalEntries: [],
  accounts: [],
  expenses: [],
  purchases: [],
  cableRolls: [],
  cableCuts: []
}

const emptySummary: InventorySummary = {
  totalProducts: 0,
  totalContacts: 0,
  totalCategories: 0,
  totalCableRolls: 0,
  lowCableRolls: 0,
  stockOnHand: 0,
  stockOnHold: 0,
  activeHolds: 0,
  unpaidBalance: { USD: 0, SYP: 0 }
}

function categoryLabel(category: Category, categories: Category[]) {
  const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : null
  return parent ? `${parent.name} / ${category.name}` : category.name
}

function contactName(id: string, contacts: Contact[]) {
  return contacts.find((contact) => contact.id === id)?.name || 'غير محدد'
}

function productName(id: string, products: Product[]) {
  return products.find((product) => product.id === id)?.name || 'منتج غير معروف'
}

function viewTitle(view: ViewKey) {
  return routes.find((route) => route.key === view)?.label || 'لوحة التحكم'
}

function labelStatus(value?: string) {
  return value ? statusLabels[value] || value : ''
}

function labelContactType(value: ContactType) {
  return contactTypeLabels[value] || value
}

function labelAccountName(name: string) {
  return accountNameLabels[name] || name
}

function labelMemo(memo: string) {
  return memoLabels[memo] || memo
}

function LoginScreen({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login(username, password)
      localStorage.setItem(TOKEN_STORAGE_KEY, result.data.token)
      onLogin(result.data.token, result.data.user)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1fr_440px]">
        <section className="flex min-h-[46vh] flex-col justify-between bg-slate-950 px-6 py-6 text-white sm:px-10 lg:min-h-screen lg:px-14">
          <div className="flex items-center gap-3">
            <Image src="/branding/honorline-logo.png" alt="HonorLine" width={64} height={64} priority className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/10" />
            <div>
              <p className="text-base font-semibold">HonorLine</p>
              <p className="text-sm text-slate-400">إدارة العمليات</p>
            </div>
          </div>
          <div className="max-w-2xl py-12">
            <p className="text-sm font-semibold text-blue-300">المخزون والمبيعات والأمانات والكابلات</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              مساحة عمل واضحة لإدارة قرارات المخزون اليومية.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              تابع المنتجات، رولات الكابل بالمتر، الجهات المسؤولة، أرصدة الزبائن، وسجل الدفعات من لوحة واحدة منظمة.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {[
              ['رولات الكابل', 'قص بالمتر'],
              ['دفاتر الحساب', 'أرصدة بالدولار والليرة'],
              ['الأمانات', 'مسؤولية العاملين']
            ].map(([title, detail]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">{title}</p>
                <p className="mt-1 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-10">
          <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700 ring-1 ring-blue-100">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xl font-semibold text-slate-950">تسجيل دخول الإدارة</p>
                <p className="text-sm text-slate-500">استخدم بيانات دخول لوحة التحكم.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <Field label="اسم المستخدم">
                <input value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass()} autoComplete="username" />
              </Field>
              <Field label="كلمة المرور" hint="بيانات التطوير: admin / admin1234">
                <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} className={inputClass()} autoComplete="current-password" />
              </Field>
            </div>
            {error ? <div className="mt-4"><Alert tone="danger">{error}</Alert></div> : null}
            <Button loading={loading} className="mt-6 w-full" icon={ShieldCheck}>
              دخول
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}

export function InventoryApp({ view }: { view: ViewKey }) {
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<InventoryData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const headers = authHeaders(token)
      const [summary, products, categories, contacts, workers, customers, holds, sales, payments, accountingDashboard, financialStatements, journalEntries, accounts, expenses, purchases, cableRolls, cableCuts] = await Promise.all([
        apiRequest<ApiResponse<InventorySummary>>('/api/inventory/summary', { headers }),
        apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
        apiRequest<ApiResponse<Category[]>>('/api/categories', { headers }),
        apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers }),
        apiRequest<ApiResponse<WorkerDetail[]>>('/api/workers', { headers }),
        apiRequest<ApiResponse<CustomerDetail[]>>('/api/customers', { headers }),
        apiRequest<ApiResponse<Hold[]>>('/api/holds', { headers }),
        apiRequest<ApiResponse<Sale[]>>('/api/sales', { headers }),
        apiRequest<ApiResponse<Payment[]>>('/api/payments', { headers }),
        apiRequest<ApiResponse<AccountingDashboard>>('/api/accounting/dashboard', { headers }),
        apiRequest<ApiResponse<FinancialStatements>>('/api/accounting/statements', { headers }),
        apiRequest<ApiResponse<JournalEntry[]>>('/api/accounting/transactions', { headers }),
        apiRequest<ApiResponse<AccountingAccount[]>>('/api/accounting/accounts', { headers }),
        apiRequest<ApiResponse<InventoryData['expenses']>>('/api/accounting/expenses', { headers }),
        apiRequest<ApiResponse<InventoryData['purchases']>>('/api/accounting/purchases', { headers }),
        apiRequest<ApiResponse<CableRoll[]>>('/api/cables/rolls', { headers }),
        apiRequest<ApiResponse<CableCut[]>>('/api/cables/cuts', { headers })
      ])
      setData({
        summary: summary.data,
        products: products.data,
        categories: categories.data,
        contacts: contacts.data,
        workers: workers.data,
        customers: customers.data,
        holds: holds.data,
        sales: sales.data,
        payments: payments.data,
        accountingDashboard: accountingDashboard.data,
        financialStatements: financialStatements.data,
        journalEntries: journalEntries.data,
        accounts: accounts.data,
        expenses: expenses.data,
        purchases: purchases.data,
        cableRolls: cableRolls.data,
        cableCuts: cableCuts.data
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل بيانات النظام')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (savedToken) setToken(savedToken)
    setReady(true)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleLogin(nextToken: string, nextUser: User) {
    setToken(nextToken)
    setUser(nextUser)
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setUser(null)
  }

  async function mutate(action: string, run: () => Promise<void>) {
    setSaving(action)
    setError('')
    try {
      await run()
      await loadData()
      setSuccess('تم الحفظ بنجاح')
      window.setTimeout(() => setSuccess(''), 2200)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'فشلت العملية')
    } finally {
      setSaving('')
    }
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 text-slate-700">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden="true" />
      </main>
    )
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />

  const summary = data.summary || emptySummary

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-slate-800 bg-slate-950 px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-68 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <Image src="/branding/honorline-logo.png" alt="HonorLine" width={56} height={56} priority className="h-11 w-11 rounded-lg object-cover ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">HonorLine</p>
              <p className="text-xs text-slate-400">إدارة المخزون والمحاسبة</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:mt-7 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="القائمة الرئيسية">
            {routes.map((route) => {
              const Icon = route.icon
              const active = view === route.key
              return (
                <Link
                  key={route.key}
                  href={route.href}
                  className={cx(
                    'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{route.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-700">نظام إدارة ومحاسبة احترافي</p>
                <h1 className="mt-0.5 truncate text-2xl font-semibold text-slate-950">{viewTitle(view)}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="blue">{user?.username || 'admin'}</StatusPill>
                <Button type="button" variant="secondary" icon={RefreshCw} onClick={loadData} loading={loading}>
                  تحديث
                </Button>
                <Button type="button" variant="quiet" icon={LogOut} onClick={logout}>
                  خروج
                </Button>
              </div>
            </div>
          </header>
          <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            {error ? <Alert tone="danger">{error}</Alert> : null}
            {success ? <Alert tone="success">{success}</Alert> : null}
            {loading ? <Alert tone="neutral">جار تحميل البيانات...</Alert> : null}
            {view === 'dashboard' ? <DashboardView summary={summary} data={data} /> : null}
            {view === 'categories' ? <CategoriesView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'products' ? <ProductsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'contacts' ? <ContactsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'workers' ? <WorkersView data={data} /> : null}
            {view === 'customers' ? <CustomersView data={data} /> : null}
            {view === 'holds' ? <HoldsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'sales' ? <SalesView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'payments' ? <PaymentsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'accounting' ? <AccountingView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'cables' ? <CablesView data={data} token={token} mutate={mutate} saving={saving} /> : null}
          </div>
        </section>
      </div>
    </main>
  )
}

function DashboardView({ summary, data }: { summary: InventorySummary; data: InventoryData }) {
  const lowRolls = data.cableRolls.filter((roll) => roll.remainingMeters <= roll.lowMeterAlert)

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Boxes} label="المنتجات" value={String(summary.totalProducts)} detail={`${summary.totalCategories} تصنيف`} />
        <Metric icon={Warehouse} label="المتوفر بالمخزون" value={String(summary.stockOnHand)} detail={`${summary.stockOnHold} في الأمانات`} tone="slate" />
        <Metric icon={Cable} label="رولات الكابل" value={String(summary.totalCableRolls)} detail={`${summary.lowCableRolls} رولات منخفضة`} tone={summary.lowCableRolls > 0 ? 'amber' : 'emerald'} />
        <Metric icon={WalletCards} label="غير مدفوع" value={formatBalances(summary.unpaidBalance)} detail={`${summary.activeHolds} أمانات نشطة`} tone="blue" />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="آخر المبيعات" description="أحدث العمليات مع عرض الرصيد المفتوح.">
          <SimpleRows
            icon={ShoppingCart}
            rows={data.sales.slice(0, 6).map((sale) => [productName(sale.productId, data.products), formatMoney(sale.balanceDue), labelStatus(sale.status)])}
            empty="لا توجد مبيعات بعد."
          />
        </Panel>
        <Panel title="رولات كابل منخفضة" description="الرولات التي وصلت إلى حد التنبيه أو أقل.">
          <SimpleRows
            icon={AlertTriangle}
            rows={lowRolls.map((roll) => [roll.rollCode, `${roll.remainingMeters} م متبقي`, roll.location || 'لا يوجد موقع'])}
            empty="لا توجد رولات منخفضة."
          />
        </Panel>
      </section>
    </>
  )
}

function SimpleRows({
  rows,
  empty,
  icon
}: {
  rows: string[][]
  empty: string
  icon?: typeof LayoutDashboard
}) {
  if (rows.length === 0) return <EmptyState title={empty} icon={icon} />

  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 px-3 py-3 text-sm sm:grid-cols-3">
          {row.map((cell, cellIndex) => (
            <span key={cellIndex} className={cx('min-w-0 truncate', cellIndex === 0 ? 'font-semibold text-slate-950' : 'text-slate-600')}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function CategorySelect({ categories, value, onChange }: { categories: Category[]; value: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass()}>
      <option value="">بدون تصنيف</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {categoryLabel(category, categories)}
        </option>
      ))}
    </select>
  )
}

type ViewProps = {
  data: InventoryData
  token: string
  mutate: (action: string, run: () => Promise<void>) => Promise<void>
  saving: string
}

function CategoriesView({ data, token, mutate, saving }: ViewProps) {
  const [form, setForm] = useState({ name: '', parentId: '', description: '' })
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title="إنشاء تصنيف" description="نظم المنتجات ورولات الكابل حسب مجال العمل.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('category', async () => {
              await apiRequest('/api/categories', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(form) })
              setForm({ name: '', parentId: '', description: '' })
              setOpen(false)
            })
          }}
        >
          <Field label="الاسم">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="التصنيف الأب">
            <CategorySelect categories={data.categories} value={form.parentId} onChange={(parentId) => setForm({ ...form, parentId })} />
          </Field>
          <Field label="الوصف">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass()} rows={3} />
          </Field>
          <Button loading={saving === 'category'} icon={Save}>
            إنشاء تصنيف
          </Button>
        </form>
      </Modal>
      <Panel
        title="شجرة التصنيفات"
        description="عدد المنتجات والرولات ضمن كل تصنيف."
        actions={
          <Button type="button" icon={FolderTree} onClick={() => setOpen(true)}>
            إنشاء تصنيف
          </Button>
        }
      >
        <SimpleRows
          icon={FolderTree}
          rows={data.categories.map((category) => [categoryLabel(category, data.categories), `${category.productCount ?? 0} منتج`, `${category.cableRollCount ?? 0} رول`])}
          empty="لا توجد تصنيفات بعد."
        />
      </Panel>
    </section>
  )
}

function ProductsView({ data, token, mutate, saving }: ViewProps) {
  const [form, setForm] = useState({ name: '', sku: '', category: '', categoryId: '', quantityOnHand: '0', costPrice: '0', salePrice: '0', currency: 'USD' as Currency, notes: '' })
  const [stock, setStock] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title="إنشاء منتج" description="أضف مادة مخزنية مع السعر والتصنيف." size="lg">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('product', async () => {
              await apiRequest('/api/products', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ ...form, quantityOnHand: Number(form.quantityOnHand), costPrice: Number(form.costPrice), salePrice: Number(form.salePrice) })
              })
              setForm({ name: '', sku: '', category: '', categoryId: '', quantityOnHand: '0', costPrice: '0', salePrice: '0', currency: 'USD', notes: '' })
              setOpen(false)
            })
          }}
        >
          <Field label="الاسم">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="رمز المنتج">
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="العملة">
              <CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} />
            </Field>
          </div>
          <Field label="التصنيف">
            <CategorySelect categories={data.categories} value={form.categoryId} onChange={(categoryId) => setForm({ ...form, categoryId })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="الكمية">
              <input type="number" min="0" value={form.quantityOnHand} onChange={(event) => setForm({ ...form, quantityOnHand: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="التكلفة">
              <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="سعر البيع">
              <input type="number" min="0" step="0.01" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} className={inputClass()} />
            </Field>
          </div>
          <Button loading={saving === 'product'} icon={PackagePlus}>
            إنشاء منتج
          </Button>
        </form>
      </Modal>
      <Panel
        title="المنتجات"
        description="المخزون والأسعار وإدخال كميات سريع."
        actions={
          <Button type="button" icon={PackagePlus} onClick={() => setOpen(true)}>
            إنشاء منتج
          </Button>
        }
      >
        <TableShell>
          <table className={tableClass()}>
            <thead>
              <tr>
                <th className={thClass()}>المادة</th>
                <th className={thClass()}>التصنيف</th>
                <th className={thClass()}>المتوفر</th>
                <th className={thClass()}>في الأمانات</th>
                <th className={thClass()}>السعر</th>
                <th className={thClass()}>إضافة مخزون</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className={tdClass('min-w-64')}>
                    <p className="font-semibold text-slate-950">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sku || 'بدون رمز'}</p>
                  </td>
                  <td className={tdClass()}>{data.categories.find((item) => item.id === product.categoryId)?.name || product.category || 'بدون تصنيف'}</td>
                  <td className={tdClass('font-semibold text-slate-950')}>{product.quantityOnHand}</td>
                  <td className={tdClass()}>{product.quantityOnHold}</td>
                  <td className={tdClass()}>{formatMoney(product.salePrice, product.currency)}</td>
                  <td className={tdClass()}>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" value={stock[product.id] || ''} onChange={(event) => setStock({ ...stock, [product.id]: event.target.value })} className={inputClass('w-24')} />
                      <Button
                        type="button"
                        variant="secondary"
                        icon={PackagePlus}
                        loading={saving === `stock-${product.id}`}
                        onClick={() =>
                          mutate(`stock-${product.id}`, async () => {
                            await apiRequest(`/api/products/${product.id}/stock`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ quantity: Number(stock[product.id] || 0) }) })
                            setStock({ ...stock, [product.id]: '' })
                          })
                        }
                      >
                        إضافة
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {data.products.length === 0 ? <EmptyState title="لا توجد منتجات بعد." description="أنشئ أول منتج لبدء متابعة المخزون." icon={Boxes} /> : null}
      </Panel>
    </section>
  )
}

function ContactsView({ data, token, mutate, saving }: ViewProps) {
  const [form, setForm] = useState({ type: 'dealer' as ContactType, name: '', phone: '', address: '', notes: '' })
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title="إنشاء جهة" description="أضف الزبائن والعاملين والتجار والموردين.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('contact', async () => {
              await apiRequest('/api/contacts', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(form) })
              setForm({ type: 'dealer', name: '', phone: '', address: '', notes: '' })
              setOpen(false)
            })
          }}
        >
          <Field label="النوع">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ContactType })} className={inputClass()}>
              <option value="dealer">تاجر</option>
              <option value="customer">زبون</option>
              <option value="worker">عامل</option>
              <option value="supplier">مورد</option>
            </select>
          </Field>
          <Field label="الاسم">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="الهاتف">
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="العنوان">
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass()} />
          </Field>
          <Button loading={saving === 'contact'} icon={ContactRound}>
            إنشاء جهة
          </Button>
        </form>
      </Modal>
      <Panel
        title="الجهات"
        description="الأشخاص والمؤسسات المستخدمة في المبيعات والأمانات."
        actions={
          <Button type="button" icon={ContactRound} onClick={() => setOpen(true)}>
            إنشاء جهة
          </Button>
        }
      >
        <SimpleRows icon={ContactRound} rows={data.contacts.map((contact) => [contact.name, labelContactType(contact.type), contact.phone || 'بدون هاتف'])} empty="لا توجد جهات بعد." />
      </Panel>
    </section>
  )
}

function WorkersView({ data }: { data: InventoryData }) {
  return (
    <Panel title="تفاصيل العاملين" description="عدد الأمانات والأرصدة المفتوحة لكل عامل.">
      <SimpleRows
        icon={ShieldCheck}
        rows={data.workers.map((worker) => [worker.name, `${worker.detail.itemsInCustody} مواد في الأمانة`, `الرصيد ${formatBalances(worker.detail.balancesByCurrency)}`])}
        empty="لا يوجد عاملون بعد. أنشئ جهات من نوع عامل أولا."
      />
    </Panel>
  )
}

function CustomersView({ data }: { data: InventoryData }) {
  return (
    <Panel title="دفتر ديون الزبائن" description="الأرصدة المفتوحة وحركة المبيعات لكل زبون.">
      <SimpleRows
        icon={UsersRound}
        rows={data.customers.map((customer) => [customer.name, `الدين ${formatBalances(customer.ledger.balancesByCurrency)}`, `${customer.ledger.salesAsCustomer.length} عملية بيع`])}
        empty="لا يوجد زبائن بعد. أنشئ جهات من نوع زبون أولا."
      />
    </Panel>
  )
}

function HoldsView({ data, token, mutate, saving }: ViewProps) {
  const customers = data.contacts.filter((contact) => contact.type === 'customer')
  const responsible = data.contacts.filter((contact) => contact.type !== 'customer')
  const [form, setForm] = useState({ productId: '', contactId: '', finalCustomerId: '', quantity: '1', unitPrice: '0', currency: 'USD' as Currency, note: '' })
  const [actions, setActions] = useState<Record<string, string>>({})
  const [actionCustomer, setActionCustomer] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)
  const activeHolds = data.holds.filter((hold) => hold.status !== 'settled')

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title="إنشاء أمانة" description="انقل كمية إلى جهة مسؤولة أو احجزها لزبون." size="lg">
        <form
          className="grid gap-3 lg:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('hold', async () => {
              await apiRequest('/api/holds', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) }) })
              setForm({ productId: '', contactId: '', finalCustomerId: '', quantity: '1', unitPrice: '0', currency: 'USD', note: '' })
              setOpen(false)
            })
          }}
        >
          <Field label="المنتج">
            <select
              required
              value={form.productId}
              onChange={(event) => {
                const product = data.products.find((item) => item.id === event.target.value)
                setForm({ ...form, productId: event.target.value, unitPrice: product ? String(product.salePrice) : form.unitPrice, currency: product?.currency || form.currency })
              }}
              className={inputClass()}
            >
              <option value="">اختر</option>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.quantityOnHand})
                </option>
              ))}
            </select>
          </Field>
          <Field label="المسؤول">
            <select required value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })} className={inputClass()}>
              <option value="">اختر</option>
              {responsible.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الزبون">
            <select value={form.finalCustomerId} onChange={(event) => setForm({ ...form, finalCustomerId: event.target.value })} className={inputClass()}>
              <option value="">اختياري</option>
              {customers.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الكمية">
            <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="السعر">
            <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} className={inputClass()} />
          </Field>
          <div className="flex items-end">
            <Button loading={saving === 'hold'} icon={Archive} className="w-full">
              إنشاء
            </Button>
          </div>
        </form>
      </Modal>
      <Panel
        title="الأمانات"
        description="الأمانات المفتوحة وإجراءات البيع والدفع."
        actions={
          <Button type="button" icon={Archive} onClick={() => setOpen(true)}>
            إنشاء أمانة
          </Button>
        }
      >
        <SimpleRows
          icon={Archive}
          rows={data.holds.map((hold) => [
            productName(hold.productId, data.products),
            `${contactName(hold.contactId, data.contacts)} / ${contactName(hold.finalCustomerId || '', data.contacts)}`,
            `${hold.remainingQuantity} متبقي، ${formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}`
          ])}
          empty="لا توجد أمانات بعد."
        />
        {activeHolds.length > 0 ? (
          <div className="mt-4 space-y-2">
            {activeHolds.map((hold) => (
              <div key={hold.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_160px_1fr_120px_120px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{productName(hold.productId, data.products)}</p>
                  <p className="text-xs text-slate-500">المستحق {formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}</p>
                </div>
                <input type="number" min="0" placeholder="كمية / مبلغ" value={actions[hold.id] || ''} onChange={(event) => setActions({ ...actions, [hold.id]: event.target.value })} className={inputClass()} />
                <select value={actionCustomer[hold.id] || ''} onChange={(event) => setActionCustomer({ ...actionCustomer, [hold.id]: event.target.value })} className={inputClass()}>
                  <option value="">الزبون النهائي</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" icon={ShoppingCart} loading={saving === `sell-${hold.id}`} onClick={() => mutate(`sell-${hold.id}`, async () => apiRequest(`/api/holds/${hold.id}/sell`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ quantity: Number(actions[hold.id] || 0), finalCustomerId: actionCustomer[hold.id] || '' }) }))}>
                  بيع
                </Button>
                <Button type="button" variant="secondary" icon={HandCoins} loading={saving === `pay-${hold.id}`} onClick={() => mutate(`pay-${hold.id}`, async () => apiRequest(`/api/holds/${hold.id}/payment`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ amount: Number(actions[hold.id] || 0), currency: hold.currency }) }))}>
                  دفع
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>
    </section>
  )
}

function SalesView({ data, token, mutate, saving }: ViewProps) {
  const customers = data.contacts.filter((contact) => contact.type === 'customer')
  const [form, setForm] = useState({ productId: '', responsibleContactId: '', finalCustomerId: '', quantity: '1', unitPrice: '0', currency: 'USD' as Currency, note: '' })
  const [payments, setPayments] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)
  const unpaidSales = data.sales.filter((sale) => sale.status !== 'paid')

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title="بيع مباشر" description="أنشئ عملية بيع مع ربط اختياري بالمسؤول أو الزبون." size="lg">
        <form
          className="grid gap-3 lg:grid-cols-7"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('sale', async () => {
              await apiRequest('/api/sales', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) }) })
              setForm({ productId: '', responsibleContactId: '', finalCustomerId: '', quantity: '1', unitPrice: '0', currency: 'USD', note: '' })
              setOpen(false)
            })
          }}
        >
          <Field label="المنتج">
            <select
              required
              value={form.productId}
              onChange={(event) => {
                const product = data.products.find((item) => item.id === event.target.value)
                setForm({ ...form, productId: event.target.value, unitPrice: product ? String(product.salePrice) : form.unitPrice, currency: product?.currency || form.currency })
              }}
              className={inputClass()}
            >
              <option value="">اختر</option>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المسؤول">
            <select value={form.responsibleContactId} onChange={(event) => setForm({ ...form, responsibleContactId: event.target.value })} className={inputClass()}>
              <option value="">بدون</option>
              {data.contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الزبون">
            <select value={form.finalCustomerId} onChange={(event) => setForm({ ...form, finalCustomerId: event.target.value })} className={inputClass()}>
              <option value="">بدون</option>
              {customers.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الكمية">
            <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="السعر">
            <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="العملة">
            <CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} />
          </Field>
          <div className="flex items-end">
            <Button loading={saving === 'sale'} icon={ShoppingCart} className="w-full">
              إنشاء
            </Button>
          </div>
        </form>
      </Modal>
      <Panel
        title="المبيعات"
        description="آخر المبيعات وتسجيل دفعات سريع."
        actions={
          <Button type="button" icon={ShoppingCart} onClick={() => setOpen(true)}>
            بيع مباشر
          </Button>
        }
      >
        <SimpleRows icon={ShoppingCart} rows={data.sales.map((sale) => [productName(sale.productId, data.products), `${formatMoney(sale.total)} / المستحق ${formatMoney(sale.balanceDue)}`, labelStatus(sale.status)])} empty="لا توجد مبيعات بعد." />
        {unpaidSales.length > 0 ? (
          <div className="mt-4 space-y-2">
            {unpaidSales.map((sale) => (
              <div key={sale.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_180px_120px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{productName(sale.productId, data.products)}</p>
                  <p className="text-xs text-slate-500">المستحق {formatMoney(sale.balanceDue)}</p>
                </div>
                <input type="number" min="0" step="0.01" value={payments[sale.id] || ''} onChange={(event) => setPayments({ ...payments, [sale.id]: event.target.value })} className={inputClass()} />
                <Button type="button" variant="secondary" icon={HandCoins} loading={saving === `sale-pay-${sale.id}`} onClick={() => mutate(`sale-pay-${sale.id}`, async () => apiRequest(`/api/sales/${sale.id}/payment`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ amount: Number(payments[sale.id] || 0), currency: sale.total.currency }) }))}>
                  دفع
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>
    </section>
  )
}

function PaymentsView({ data, token, mutate, saving }: ViewProps) {
  const [form, setForm] = useState({ targetType: 'customer' as 'sale' | 'hold' | 'customer' | 'contact', targetId: '', amount: '0', currency: 'USD' as Currency, customerId: '', contactId: '', note: '' })
  const [open, setOpen] = useState(false)
  const targetOptions = useMemo(() => {
    if (form.targetType === 'customer') return data.customers.map((customer) => ({ id: customer.id, label: customer.name, detail: formatBalances(customer.ledger.balancesByCurrency) }))
    if (form.targetType === 'contact') return data.contacts.map((contact) => ({ id: contact.id, label: contact.name, detail: labelContactType(contact.type) }))
    if (form.targetType === 'sale') return data.sales.map((sale) => ({ id: sale.id, label: productName(sale.productId, data.products), detail: `المستحق ${formatMoney(sale.balanceDue)}` }))
    return data.holds.map((hold) => ({ id: hold.id, label: productName(hold.productId, data.products), detail: `${hold.remainingQuantity} متبقي، المستحق ${formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}` }))
  }, [data.contacts, data.customers, data.holds, data.products, data.sales, form.targetType])

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title="تسجيل دفعة" description="اختر زبونا أو جهة أو عملية بيع أو أمانة من السجلات الحالية.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('payment', async () => {
              await apiRequest('/api/payments', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
              setForm({ targetType: 'customer', targetId: '', amount: '0', currency: 'USD', customerId: '', contactId: '', note: '' })
              setOpen(false)
            })
          }}
        >
          <Field label="نوع الهدف">
            <select value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value as typeof form.targetType, targetId: '' })} className={inputClass()}>
              <option value="customer">زبون</option>
              <option value="contact">جهة</option>
              <option value="sale">بيع</option>
              <option value="hold">أمانة</option>
            </select>
          </Field>
          <Field label="الهدف">
            <select required value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} className={inputClass()}>
              <option value="">اختر {labelStatus(form.targetType)}</option>
              {targetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} - {option.detail}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="المبلغ">
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="العملة">
              <CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} />
            </Field>
          </div>
          <Button loading={saving === 'payment'} icon={HandCoins}>
            تسجيل دفعة
          </Button>
        </form>
      </Modal>
      <Panel
        title="سجل الدفعات"
        description="الدفعات المسجلة للزبائن والجهات والأمانات والمبيعات."
        actions={
          <Button type="button" icon={HandCoins} onClick={() => setOpen(true)}>
            تسجيل دفعة
          </Button>
        }
      >
        <SimpleRows icon={CreditCard} rows={data.payments.map((payment) => [formatMoney(payment.amount), `${labelStatus(payment.targetType)}: ${payment.targetId}`, dateShort(payment.createdAt)])} empty="لا توجد دفعات بعد." />
      </Panel>
    </section>
  )
}

function AccountingView({ data, token, mutate, saving }: ViewProps) {
  const [tab, setTab] = useState<'pl' | 'balance' | 'ledger'>('pl')
  const [expense, setExpense] = useState({ category: 'مصروف تشغيلي', vendorContactId: '', amount: '0', currency: 'USD' as Currency, paidStatus: 'paid' as 'paid' | 'unpaid', note: '' })
  const [purchase, setPurchase] = useState({ productId: '', supplierContactId: '', quantity: '1', unitCost: '0', currency: 'USD' as Currency, paidStatus: 'paid' as 'paid' | 'unpaid', note: '' })
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const dashboard = data.accountingDashboard
  const statements = data.financialStatements
  const metrics = dashboard?.metrics

  return (
    <section className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={WalletCards} label="النقدية" value={formatBalances(metrics?.cash)} detail={`${dashboard?.counts.journalEntries ?? 0} قيد محاسبي`} tone="emerald" />
        <Metric icon={CircleDollarSign} label="الذمم المدينة" value={formatBalances(metrics?.receivables)} detail="أرصدة الزبائن المفتوحة" tone="blue" />
        <Metric icon={Warehouse} label="قيمة المخزون" value={formatBalances(metrics?.inventory)} detail="المخزون بالتكلفة" tone="slate" />
        <Metric icon={HandCoins} label="صافي الربح" value={formatBalances(metrics?.netProfit)} detail={`المصاريف ${formatBalances(metrics?.expenses)}`} tone={(metrics?.netProfit.USD ?? 0) < 0 || (metrics?.netProfit.SYP ?? 0) < 0 ? 'amber' : 'emerald'} />
      </section>

      <section className="space-y-5">
        <Modal open={expenseOpen} onClose={() => setExpenseOpen(false)} title="تسجيل مصروف" description="رحل المصاريف التشغيلية إلى دفتر المحاسبة.">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                mutate('expense', async () => {
                  await apiRequest('/api/accounting/expenses', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...expense, amount: Number(expense.amount) }) })
                  setExpense({ category: 'مصروف تشغيلي', vendorContactId: '', amount: '0', currency: 'USD', paidStatus: 'paid', note: '' })
                  setExpenseOpen(false)
                })
              }}
            >
              <Field label="التصنيف">
                <input required value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} className={inputClass()} />
              </Field>
              <Field label="المورد">
                <select value={expense.vendorContactId} onChange={(event) => setExpense({ ...expense, vendorContactId: event.target.value })} className={inputClass()}>
                  <option value="">بدون</option>
                  {data.contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="المبلغ">
                  <input type="number" min="0" step="0.01" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} className={inputClass()} />
                </Field>
                <Field label="العملة">
                  <CurrencySelect value={expense.currency} onChange={(currency) => setExpense({ ...expense, currency })} />
                </Field>
              </div>
              <Field label="الحالة">
                <select value={expense.paidStatus} onChange={(event) => setExpense({ ...expense, paidStatus: event.target.value as typeof expense.paidStatus })} className={inputClass()}>
                  <option value="paid">مدفوع</option>
                  <option value="unpaid">غير مدفوع</option>
                </select>
              </Field>
              <Field label="ملاحظة">
                <textarea value={expense.note} onChange={(event) => setExpense({ ...expense, note: event.target.value })} className={inputClass()} rows={2} />
              </Field>
              <Button loading={saving === 'expense'} icon={Save}>
                تسجيل مصروف
              </Button>
            </form>
        </Modal>

        <Modal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} title="تسجيل شراء مخزون" description="زد المخزون ورحل النقدية أو الذمم الدائنة." size="lg">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                mutate('purchase', async () => {
                  await apiRequest('/api/accounting/purchases', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...purchase, quantity: Number(purchase.quantity), unitCost: Number(purchase.unitCost) }) })
                  setPurchase({ productId: '', supplierContactId: '', quantity: '1', unitCost: '0', currency: 'USD', paidStatus: 'paid', note: '' })
                  setPurchaseOpen(false)
                })
              }}
            >
              <Field label="المنتج">
                <select
                  required
                  value={purchase.productId}
                  onChange={(event) => {
                    const product = data.products.find((item) => item.id === event.target.value)
                    setPurchase({ ...purchase, productId: event.target.value, unitCost: product ? String(product.costPrice) : purchase.unitCost, currency: product?.currency || purchase.currency })
                  }}
                  className={inputClass()}
                >
                  <option value="">اختر المنتج</option>
                  {data.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="المورد">
                <select value={purchase.supplierContactId} onChange={(event) => setPurchase({ ...purchase, supplierContactId: event.target.value })} className={inputClass()}>
                  <option value="">بدون</option>
                  {data.contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الكمية">
                  <input type="number" min="0" step="0.01" value={purchase.quantity} onChange={(event) => setPurchase({ ...purchase, quantity: event.target.value })} className={inputClass()} />
                </Field>
                <Field label="تكلفة الوحدة">
                  <input type="number" min="0" step="0.01" value={purchase.unitCost} onChange={(event) => setPurchase({ ...purchase, unitCost: event.target.value })} className={inputClass()} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العملة">
                  <CurrencySelect value={purchase.currency} onChange={(currency) => setPurchase({ ...purchase, currency })} />
                </Field>
                <Field label="الحالة">
                  <select value={purchase.paidStatus} onChange={(event) => setPurchase({ ...purchase, paidStatus: event.target.value as typeof purchase.paidStatus })} className={inputClass()}>
                    <option value="paid">مدفوع</option>
                    <option value="unpaid">غير مدفوع</option>
                  </select>
                </Field>
              </div>
              <Button loading={saving === 'purchase'} icon={PackagePlus}>
                تسجيل شراء
              </Button>
            </form>
        </Modal>

        <Panel
          title="القوائم المالية"
          description={`تم التوليد ${dateShort(statements?.generatedAt)}`}
          actions={
            <>
              <Button type="button" icon={Save} onClick={() => setExpenseOpen(true)}>
                تسجيل مصروف
              </Button>
              <Button type="button" variant="secondary" icon={PackagePlus} onClick={() => setPurchaseOpen(true)}>
                تسجيل شراء
              </Button>
              <Button type="button" variant="secondary" icon={RefreshCw} loading={saving === 'backfill'} onClick={() => mutate('backfill', async () => apiRequest('/api/accounting/backfill', { method: 'POST', headers: authHeaders(token) }))}>
                ترحيل التاريخ
              </Button>
            </>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              ['pl', 'الأرباح والخسائر'],
              ['balance', 'الميزانية العمومية'],
              ['ledger', 'دفتر القيود']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key as typeof tab)}
                className={cx('rounded-lg border px-3 py-2 text-sm font-semibold transition', tab === key ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700')}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'pl' ? <ProfitAndLossView statements={statements} /> : null}
          {tab === 'balance' ? <BalanceSheetView statements={statements} /> : null}
          {tab === 'ledger' ? <JournalLedgerView entries={data.journalEntries} accounts={data.accounts} contacts={data.contacts} /> : null}
        </Panel>
      </section>
    </section>
  )
}

function MoneyColumns({ balance }: { balance?: Record<Currency, number> }) {
  return (
    <>
      <td className={tdClass('font-semibold text-slate-950')}>{formatMoney(balance?.USD ?? 0, 'USD')}</td>
      <td className={tdClass('font-semibold text-slate-950')}>{formatMoney(balance?.SYP ?? 0, 'SYP')}</td>
    </>
  )
}

function StatementLine({ label, balance, strong = false }: { label: string; balance?: Record<Currency, number>; strong?: boolean }) {
  return (
    <tr className={strong ? 'bg-slate-50' : ''}>
      <td className={tdClass(strong ? 'font-semibold text-slate-950' : '')}>{label}</td>
      <MoneyColumns balance={balance} />
    </tr>
  )
}

function ProfitAndLossView({ statements }: { statements: FinancialStatements | null }) {
  const profit = statements?.profitAndLoss
  return (
    <TableShell>
      <table className={tableClass()}>
        <thead>
          <tr>
            <th className={thClass()}>البند</th>
            <th className={thClass()}>USD</th>
            <th className={thClass()}>SYP</th>
          </tr>
        </thead>
        <tbody>
          <StatementLine label="إيرادات المبيعات" balance={profit?.revenue} />
          <StatementLine label="تكلفة البضاعة المباعة" balance={profit?.cogs} />
          <StatementLine label="مجمل الربح" balance={profit?.grossProfit} strong />
          <StatementLine label="المصاريف التشغيلية" balance={profit?.operatingExpenses} />
          <StatementLine label="صافي الربح" balance={profit?.netProfit} strong />
        </tbody>
      </table>
    </TableShell>
  )
}

function BalanceSection({ title, rows }: { title: string; rows: AccountBalance[] }) {
  return (
    <>
      <tr>
        <td colSpan={3} className={tdClass('bg-slate-50 text-xs font-semibold uppercase text-slate-500')}>
          {title}
        </td>
      </tr>
      {rows.map((row) => (
        <StatementLine key={row.account.id} label={`${row.account.code} ${labelAccountName(row.account.name)}`} balance={row.balance} />
      ))}
    </>
  )
}

function BalanceSheetView({ statements }: { statements: FinancialStatements | null }) {
  const sheet = statements?.balanceSheet
  return (
    <TableShell>
      <table className={tableClass()}>
        <thead>
          <tr>
            <th className={thClass()}>الحساب</th>
            <th className={thClass()}>USD</th>
            <th className={thClass()}>SYP</th>
          </tr>
        </thead>
        <tbody>
          <BalanceSection title="الأصول" rows={sheet?.assets ?? []} />
          <StatementLine label="إجمالي الأصول" balance={sheet?.totals.assets} strong />
          <BalanceSection title="الالتزامات" rows={sheet?.liabilities ?? []} />
          <StatementLine label="إجمالي الالتزامات" balance={sheet?.totals.liabilities} strong />
          <BalanceSection title="حقوق الملكية" rows={sheet?.equity ?? []} />
          <StatementLine label="أرباح الفترة الحالية" balance={sheet?.currentEarnings} />
          <StatementLine label="إجمالي حقوق الملكية" balance={sheet?.totals.equity} strong />
          <StatementLine label="الالتزامات وحقوق الملكية" balance={sheet?.totals.liabilitiesAndEquity} strong />
        </tbody>
      </table>
    </TableShell>
  )
}

function JournalLedgerView({ entries, contacts }: { entries: JournalEntry[]; accounts: AccountingAccount[]; contacts: Contact[] }) {
  if (entries.length === 0) return <EmptyState title="لا توجد قيود محاسبية بعد." description="شغل ترحيل التاريخ أو سجل بيعا أو دفعة أو مصروفا أو شراء." icon={CircleDollarSign} />

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{entry.memo ? labelMemo(entry.memo) : `${labelStatus(entry.sourceType)} ${labelStatus(entry.sourceAction)}`}</p>
              <p className="text-xs text-slate-500">
                {dateShort(entry.date)} - <span dir="ltr" className="inline-block">{labelStatus(entry.sourceType)}:{entry.sourceId}</span> {entry.partyId ? `- ${contactName(entry.partyId, contacts)}` : ''}
              </p>
            </div>
            <StatusPill tone={entry.balanced ? 'success' : 'danger'}>{entry.balanced ? 'متوازن' : 'غير متوازن'}</StatusPill>
          </div>
          <TableShell>
            <table className={tableClass()}>
              <thead>
                <tr>
                  <th className={thClass()}>الحساب</th>
                  <th className={thClass()}>الوصف</th>
                  <th className={thClass()}>مدين</th>
                  <th className={thClass()}>دائن</th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((line, index) => (
                  <tr key={`${entry.id}-${index}`}>
                    <td className={tdClass('font-semibold text-slate-950')}>{line.accountCode} {labelAccountName(line.accountName)}</td>
                    <td className={tdClass()}>{line.description || '-'}</td>
                    <td className={tdClass()}>{line.debit > 0 ? formatMoney(line.debit, line.currency) : '-'}</td>
                    <td className={tdClass()}>{line.credit > 0 ? formatMoney(line.credit, line.currency) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>
      ))}
    </div>
  )
}

function CablesView({ data, token, mutate, saving }: ViewProps) {
  const customers = data.contacts.filter((contact) => contact.type === 'customer')
  const [rollForm, setRollForm] = useState({ productId: '', rollCode: '', cableType: 'Cat6', categoryId: '', color: '', originalMeters: '305', costPerMeter: '0', salePricePerMeter: '0', currency: 'USD' as Currency, location: '', lowMeterAlert: '15', notes: '' })
  const [cuts, setCuts] = useState<Record<string, { meters: string; pricePerMeter: string; destinationType: 'sale' | 'hold' | 'use'; responsibleContactId: string; finalCustomerId: string; currency: Currency }>>({})
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title="إنشاء رول كابل" description="سجل رول جديد وحدد حد التنبيه بالمتر." size="lg">
        <form
          className="grid gap-3 lg:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('roll', async () => {
              await apiRequest('/api/cables/rolls', {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ ...rollForm, originalMeters: Number(rollForm.originalMeters), costPerMeter: Number(rollForm.costPerMeter), salePricePerMeter: Number(rollForm.salePricePerMeter), lowMeterAlert: Number(rollForm.lowMeterAlert) })
              })
              setRollForm({ productId: '', rollCode: '', cableType: 'Cat6', categoryId: '', color: '', originalMeters: '305', costPerMeter: '0', salePricePerMeter: '0', currency: 'USD', location: '', lowMeterAlert: '15', notes: '' })
              setOpen(false)
            })
          }}
        >
          <Field label="المنتج">
            <select required value={rollForm.productId} onChange={(event) => setRollForm({ ...rollForm, productId: event.target.value })} className={inputClass()}>
              <option value="">اختر</option>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="رمز الرول">
            <input required value={rollForm.rollCode} onChange={(event) => setRollForm({ ...rollForm, rollCode: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="النوع">
            <input value={rollForm.cableType} onChange={(event) => setRollForm({ ...rollForm, cableType: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="الأمتار">
            <input type="number" min="1" value={rollForm.originalMeters} onChange={(event) => setRollForm({ ...rollForm, originalMeters: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="سعر المتر">
            <input type="number" min="0" step="0.01" value={rollForm.salePricePerMeter} onChange={(event) => setRollForm({ ...rollForm, salePricePerMeter: event.target.value })} className={inputClass()} />
          </Field>
          <div className="flex items-end">
            <Button loading={saving === 'roll'} icon={Cable} className="w-full">
              إنشاء
            </Button>
          </div>
        </form>
      </Modal>
      <Panel
        title="رولات الكابل"
        description="قص الأمتار كمبيعات أو أمانات أو استخدام داخلي."
        actions={
          <Button type="button" icon={Cable} onClick={() => setOpen(true)}>
            إنشاء رول كابل
          </Button>
        }
      >
        <div className="space-y-3">
          {data.cableRolls.map((roll) => {
            const cut = cuts[roll.id] || { meters: '', pricePerMeter: String(roll.salePricePerMeter.amount), destinationType: 'sale' as const, responsibleContactId: '', finalCustomerId: '', currency: roll.salePricePerMeter.currency }
            return (
              <div key={roll.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{roll.rollCode} - {roll.cableType}</p>
                    <p className="text-sm text-slate-500">{roll.remainingMeters} م متبقي من {roll.originalMeters} م - {roll.location || 'لا يوجد موقع'}</p>
                  </div>
                  {roll.remainingMeters <= roll.lowMeterAlert ? <StatusPill tone="warning">رول منخفض</StatusPill> : <StatusPill tone="success">جاهز</StatusPill>}
                </div>
                <div className="mt-4 grid gap-2 lg:grid-cols-6">
                  <select value={cut.destinationType} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, destinationType: event.target.value as typeof cut.destinationType } })} className={inputClass()}>
                    <option value="sale">بيع</option>
                    <option value="hold">أمانة / استخدام</option>
                    <option value="use">استخدام داخلي</option>
                  </select>
                  <input type="number" min="0" placeholder="الأمتار" value={cut.meters} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, meters: event.target.value } })} className={inputClass()} />
                  <input type="number" min="0" step="0.01" placeholder="سعر المتر" value={cut.pricePerMeter} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, pricePerMeter: event.target.value } })} className={inputClass()} />
                  <select value={cut.responsibleContactId} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, responsibleContactId: event.target.value } })} className={inputClass()}>
                    <option value="">المسؤول</option>
                    {data.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                  <select value={cut.finalCustomerId} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, finalCustomerId: event.target.value } })} className={inputClass()}>
                    <option value="">الزبون</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="secondary" icon={Scissors} loading={saving === `cut-${roll.id}`} onClick={() => mutate(`cut-${roll.id}`, async () => apiRequest(`/api/cables/rolls/${roll.id}/cut`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...cut, meters: Number(cut.meters), pricePerMeter: Number(cut.pricePerMeter) }) }))}>
                    قص
                  </Button>
                </div>
              </div>
            )
          })}
          {data.cableRolls.length === 0 ? <EmptyState title="لا توجد رولات كابل بعد." description="أنشئ رولا قبل قص الأمتار." icon={Cable} /> : null}
        </div>
      </Panel>
    </section>
  )
}
