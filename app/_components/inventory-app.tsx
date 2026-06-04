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
  ApiResponse,
  CableCut,
  CableRoll,
  Category,
  Contact,
  ContactType,
  Currency,
  CustomerDetail,
  Hold,
  InventoryData,
  InventorySummary,
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
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', href: '/products', icon: Boxes },
  { key: 'categories', label: 'Categories', href: '/categories', icon: FolderTree },
  { key: 'contacts', label: 'Contacts', href: '/contacts', icon: ContactRound },
  { key: 'workers', label: 'Workers', href: '/workers', icon: ShieldCheck },
  { key: 'customers', label: 'Customers', href: '/customers', icon: UsersRound },
  { key: 'holds', label: 'On Hold', href: '/holds', icon: Archive },
  { key: 'sales', label: 'Sales', href: '/sales', icon: ShoppingCart },
  { key: 'payments', label: 'Payments', href: '/payments', icon: CreditCard },
  { key: 'cables', label: 'Cables', href: '/cables', icon: Cable }
] satisfies Array<{ key: ViewKey; label: string; href: string; icon: typeof LayoutDashboard }>

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
  return contacts.find((contact) => contact.id === id)?.name || 'Unassigned'
}

function productName(id: string, products: Product[]) {
  return products.find((product) => product.id === id)?.name || 'Unknown product'
}

function viewTitle(view: ViewKey) {
  return routes.find((route) => route.key === view)?.label || 'Dashboard'
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
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in')
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
              <p className="text-sm text-slate-400">Admin operations</p>
            </div>
          </div>
          <div className="max-w-2xl py-12">
            <p className="text-sm font-semibold text-blue-300">Inventory, sales, custody, and cable control</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              A focused workspace for everyday stock decisions.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Track product stock, cable rolls by meter, responsible contacts, customer balances, and payment history from one clean console.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {[
              ['Cable rolls', 'Meter-based cuts'],
              ['Ledgers', 'USD and SYP balances'],
              ['Custody', 'Worker accountability']
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
                <p className="text-xl font-semibold text-slate-950">Admin sign in</p>
                <p className="text-sm text-slate-500">Use your console credentials.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <Field label="Username">
                <input value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass()} autoComplete="username" />
              </Field>
              <Field label="Password" hint="Development default: admin / admin1234">
                <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} className={inputClass()} autoComplete="current-password" />
              </Field>
            </div>
            {error ? <div className="mt-4"><Alert tone="danger">{error}</Alert></div> : null}
            <Button loading={loading} className="mt-6 w-full" icon={ShieldCheck}>
              Sign in
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
      const [summary, products, categories, contacts, workers, customers, holds, sales, payments, cableRolls, cableCuts] = await Promise.all([
        apiRequest<ApiResponse<InventorySummary>>('/api/inventory/summary', { headers }),
        apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
        apiRequest<ApiResponse<Category[]>>('/api/categories', { headers }),
        apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers }),
        apiRequest<ApiResponse<WorkerDetail[]>>('/api/workers', { headers }),
        apiRequest<ApiResponse<CustomerDetail[]>>('/api/customers', { headers }),
        apiRequest<ApiResponse<Hold[]>>('/api/holds', { headers }),
        apiRequest<ApiResponse<Sale[]>>('/api/sales', { headers }),
        apiRequest<ApiResponse<Payment[]>>('/api/payments', { headers }),
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
        cableRolls: cableRolls.data,
        cableCuts: cableCuts.data
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load inventory')
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
      setSuccess('Saved successfully')
      window.setTimeout(() => setSuccess(''), 2200)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Action failed')
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
              <p className="text-xs text-slate-400">Inventory admin</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:mt-7 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Primary">
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
                <p className="text-xs font-semibold text-blue-700">Professional inventory</p>
                <h1 className="mt-0.5 truncate text-2xl font-semibold text-slate-950">{viewTitle(view)}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone="blue">{user?.username || 'admin'}</StatusPill>
                <Button type="button" variant="secondary" icon={RefreshCw} onClick={loadData} loading={loading}>
                  Refresh
                </Button>
                <Button type="button" variant="quiet" icon={LogOut} onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>
          <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            {error ? <Alert tone="danger">{error}</Alert> : null}
            {success ? <Alert tone="success">{success}</Alert> : null}
            {loading ? <Alert tone="neutral">Loading inventory data...</Alert> : null}
            {view === 'dashboard' ? <DashboardView summary={summary} data={data} /> : null}
            {view === 'categories' ? <CategoriesView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'products' ? <ProductsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'contacts' ? <ContactsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'workers' ? <WorkersView data={data} /> : null}
            {view === 'customers' ? <CustomersView data={data} /> : null}
            {view === 'holds' ? <HoldsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'sales' ? <SalesView data={data} token={token} mutate={mutate} saving={saving} /> : null}
            {view === 'payments' ? <PaymentsView data={data} token={token} mutate={mutate} saving={saving} /> : null}
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
        <Metric icon={Boxes} label="Products" value={String(summary.totalProducts)} detail={`${summary.totalCategories} categories`} />
        <Metric icon={Warehouse} label="Stock on hand" value={String(summary.stockOnHand)} detail={`${summary.stockOnHold} on hold`} tone="slate" />
        <Metric icon={Cable} label="Cable rolls" value={String(summary.totalCableRolls)} detail={`${summary.lowCableRolls} low rolls`} tone={summary.lowCableRolls > 0 ? 'amber' : 'emerald'} />
        <Metric icon={WalletCards} label="Unpaid" value={formatBalances(summary.unpaidBalance)} detail={`${summary.activeHolds} active holds`} tone="blue" />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Recent sales" description="Latest activity with open balance visibility.">
          <SimpleRows
            icon={ShoppingCart}
            rows={data.sales.slice(0, 6).map((sale) => [productName(sale.productId, data.products), formatMoney(sale.balanceDue), sale.status])}
            empty="No sales yet."
          />
        </Panel>
        <Panel title="Low cable rolls" description="Rolls at or below their meter alert.">
          <SimpleRows
            icon={AlertTriangle}
            rows={lowRolls.map((roll) => [roll.rollCode, `${roll.remainingMeters}m remaining`, roll.location || 'No location'])}
            empty="No low cable rolls."
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
      <option value="">No category</option>
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

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Panel title="Create category" description="Group products and cable rolls by business area.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('category', async () => {
              await apiRequest('/api/categories', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(form) })
              setForm({ name: '', parentId: '', description: '' })
            })
          }}
        >
          <Field label="Name">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Parent">
            <CategorySelect categories={data.categories} value={form.parentId} onChange={(parentId) => setForm({ ...form, parentId })} />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={inputClass()} rows={3} />
          </Field>
          <Button loading={saving === 'category'} icon={Save}>
            Create category
          </Button>
        </form>
      </Panel>
      <Panel title="Category tree" description="Product and roll counts by category.">
        <SimpleRows
          icon={FolderTree}
          rows={data.categories.map((category) => [categoryLabel(category, data.categories), `${category.productCount ?? 0} products`, `${category.cableRollCount ?? 0} rolls`])}
          empty="No categories yet."
        />
      </Panel>
    </section>
  )
}

function ProductsView({ data, token, mutate, saving }: ViewProps) {
  const [form, setForm] = useState({ name: '', sku: '', category: '', categoryId: '', quantityOnHand: '0', costPrice: '0', salePrice: '0', currency: 'USD' as Currency, notes: '' })
  const [stock, setStock] = useState<Record<string, string>>({})

  return (
    <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Panel title="Create product" description="Add a stocked item with pricing and category.">
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
            })
          }}
        >
          <Field label="Name">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SKU">
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="Currency">
              <CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} />
            </Field>
          </div>
          <Field label="Category">
            <CategorySelect categories={data.categories} value={form.categoryId} onChange={(categoryId) => setForm({ ...form, categoryId })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Qty">
              <input type="number" min="0" value={form.quantityOnHand} onChange={(event) => setForm({ ...form, quantityOnHand: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="Cost">
              <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="Sale">
              <input type="number" min="0" step="0.01" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} className={inputClass()} />
            </Field>
          </div>
          <Button loading={saving === 'product'} icon={PackagePlus}>
            Create product
          </Button>
        </form>
      </Panel>
      <Panel title="Products" description="Stock levels, pricing, and quick stock intake.">
        <TableShell>
          <table className={tableClass()}>
            <thead>
              <tr>
                <th className={thClass()}>Item</th>
                <th className={thClass()}>Category</th>
                <th className={thClass()}>On hand</th>
                <th className={thClass()}>On hold</th>
                <th className={thClass()}>Price</th>
                <th className={thClass()}>Add stock</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className={tdClass('min-w-64')}>
                    <p className="font-semibold text-slate-950">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sku || 'No SKU'}</p>
                  </td>
                  <td className={tdClass()}>{data.categories.find((item) => item.id === product.categoryId)?.name || product.category || 'No category'}</td>
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
                        Add
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {data.products.length === 0 ? <EmptyState title="No products yet." description="Create the first product to start tracking stock." icon={Boxes} /> : null}
      </Panel>
    </section>
  )
}

function ContactsView({ data, token, mutate, saving }: ViewProps) {
  const [form, setForm] = useState({ type: 'dealer' as ContactType, name: '', phone: '', address: '', notes: '' })

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Panel title="Create contact" description="Add customers, workers, dealers, and suppliers.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('contact', async () => {
              await apiRequest('/api/contacts', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(form) })
              setForm({ type: 'dealer', name: '', phone: '', address: '', notes: '' })
            })
          }}
        >
          <Field label="Type">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ContactType })} className={inputClass()}>
              <option value="dealer">Dealer</option>
              <option value="customer">Customer</option>
              <option value="worker">Worker</option>
              <option value="supplier">Supplier</option>
            </select>
          </Field>
          <Field label="Name">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass()} />
          </Field>
          <Button loading={saving === 'contact'} icon={ContactRound}>
            Create contact
          </Button>
        </form>
      </Panel>
      <Panel title="Contacts" description="People and organizations used across sales and custody.">
        <SimpleRows icon={ContactRound} rows={data.contacts.map((contact) => [contact.name, contact.type, contact.phone || 'No phone'])} empty="No contacts yet." />
      </Panel>
    </section>
  )
}

function WorkersView({ data }: { data: InventoryData }) {
  return (
    <Panel title="Worker details" description="Custody count and outstanding balances by worker.">
      <SimpleRows
        icon={ShieldCheck}
        rows={data.workers.map((worker) => [worker.name, `${worker.detail.itemsInCustody} items in custody`, `Balance ${formatBalances(worker.detail.balancesByCurrency)}`])}
        empty="No workers yet. Create worker contacts first."
      />
    </Panel>
  )
}

function CustomersView({ data }: { data: InventoryData }) {
  return (
    <Panel title="Customer debt ledger" description="Open balances and sale activity by customer.">
      <SimpleRows
        icon={UsersRound}
        rows={data.customers.map((customer) => [customer.name, `Debt ${formatBalances(customer.ledger.balancesByCurrency)}`, `${customer.ledger.salesAsCustomer.length} sale(s)`])}
        empty="No customers yet. Create customer contacts first."
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
  const activeHolds = data.holds.filter((hold) => hold.status !== 'settled')

  return (
    <section className="space-y-5">
      <Panel title="Create hold / custody" description="Move stock to a responsible contact or reserve it for a customer.">
        <form
          className="grid gap-3 lg:grid-cols-6"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('hold', async () => {
              await apiRequest('/api/holds', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) }) })
              setForm({ productId: '', contactId: '', finalCustomerId: '', quantity: '1', unitPrice: '0', currency: 'USD', note: '' })
            })
          }}
        >
          <Field label="Product">
            <select
              required
              value={form.productId}
              onChange={(event) => {
                const product = data.products.find((item) => item.id === event.target.value)
                setForm({ ...form, productId: event.target.value, unitPrice: product ? String(product.salePrice) : form.unitPrice, currency: product?.currency || form.currency })
              }}
              className={inputClass()}
            >
              <option value="">Select</option>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.quantityOnHand})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Responsible">
            <select required value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })} className={inputClass()}>
              <option value="">Select</option>
              {responsible.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Customer">
            <select value={form.finalCustomerId} onChange={(event) => setForm({ ...form, finalCustomerId: event.target.value })} className={inputClass()}>
              <option value="">Optional</option>
              {customers.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Qty">
            <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Price">
            <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} className={inputClass()} />
          </Field>
          <div className="flex items-end">
            <Button loading={saving === 'hold'} icon={Archive} className="w-full">
              Create
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Holds" description="Open custody and settlement actions.">
        <SimpleRows
          icon={Archive}
          rows={data.holds.map((hold) => [
            productName(hold.productId, data.products),
            `${contactName(hold.contactId, data.contacts)} / ${contactName(hold.finalCustomerId || '', data.contacts)}`,
            `${hold.remainingQuantity} left, ${formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}`
          ])}
          empty="No holds yet."
        />
        {activeHolds.length > 0 ? (
          <div className="mt-4 space-y-2">
            {activeHolds.map((hold) => (
              <div key={hold.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_160px_1fr_120px_120px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{productName(hold.productId, data.products)}</p>
                  <p className="text-xs text-slate-500">Due {formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}</p>
                </div>
                <input type="number" min="0" placeholder="Qty / amount" value={actions[hold.id] || ''} onChange={(event) => setActions({ ...actions, [hold.id]: event.target.value })} className={inputClass()} />
                <select value={actionCustomer[hold.id] || ''} onChange={(event) => setActionCustomer({ ...actionCustomer, [hold.id]: event.target.value })} className={inputClass()}>
                  <option value="">Final customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" icon={ShoppingCart} loading={saving === `sell-${hold.id}`} onClick={() => mutate(`sell-${hold.id}`, async () => apiRequest(`/api/holds/${hold.id}/sell`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ quantity: Number(actions[hold.id] || 0), finalCustomerId: actionCustomer[hold.id] || '' }) }))}>
                  Sell
                </Button>
                <Button type="button" variant="secondary" icon={HandCoins} loading={saving === `pay-${hold.id}`} onClick={() => mutate(`pay-${hold.id}`, async () => apiRequest(`/api/holds/${hold.id}/payment`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ amount: Number(actions[hold.id] || 0), currency: hold.currency }) }))}>
                  Pay
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
  const unpaidSales = data.sales.filter((sale) => sale.status !== 'paid')

  return (
    <section className="space-y-5">
      <Panel title="Direct product sale" description="Create a sale and optional responsible contact/customer link.">
        <form
          className="grid gap-3 lg:grid-cols-7"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('sale', async () => {
              await apiRequest('/api/sales', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) }) })
              setForm({ productId: '', responsibleContactId: '', finalCustomerId: '', quantity: '1', unitPrice: '0', currency: 'USD', note: '' })
            })
          }}
        >
          <Field label="Product">
            <select
              required
              value={form.productId}
              onChange={(event) => {
                const product = data.products.find((item) => item.id === event.target.value)
                setForm({ ...form, productId: event.target.value, unitPrice: product ? String(product.salePrice) : form.unitPrice, currency: product?.currency || form.currency })
              }}
              className={inputClass()}
            >
              <option value="">Select</option>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Responsible">
            <select value={form.responsibleContactId} onChange={(event) => setForm({ ...form, responsibleContactId: event.target.value })} className={inputClass()}>
              <option value="">None</option>
              {data.contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Customer">
            <select value={form.finalCustomerId} onChange={(event) => setForm({ ...form, finalCustomerId: event.target.value })} className={inputClass()}>
              <option value="">None</option>
              {customers.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Qty">
            <input type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Price">
            <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Currency">
            <CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} />
          </Field>
          <div className="flex items-end">
            <Button loading={saving === 'sale'} icon={ShoppingCart} className="w-full">
              Create
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Sales" description="Recent sales and quick payment capture.">
        <SimpleRows icon={ShoppingCart} rows={data.sales.map((sale) => [productName(sale.productId, data.products), `${formatMoney(sale.total)} / due ${formatMoney(sale.balanceDue)}`, sale.status])} empty="No sales yet." />
        {unpaidSales.length > 0 ? (
          <div className="mt-4 space-y-2">
            {unpaidSales.map((sale) => (
              <div key={sale.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_180px_120px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{productName(sale.productId, data.products)}</p>
                  <p className="text-xs text-slate-500">Due {formatMoney(sale.balanceDue)}</p>
                </div>
                <input type="number" min="0" step="0.01" value={payments[sale.id] || ''} onChange={(event) => setPayments({ ...payments, [sale.id]: event.target.value })} className={inputClass()} />
                <Button type="button" variant="secondary" icon={HandCoins} loading={saving === `sale-pay-${sale.id}`} onClick={() => mutate(`sale-pay-${sale.id}`, async () => apiRequest(`/api/sales/${sale.id}/payment`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ amount: Number(payments[sale.id] || 0), currency: sale.total.currency }) }))}>
                  Pay
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
  const targetOptions = useMemo(() => {
    if (form.targetType === 'customer') return data.customers.map((customer) => ({ id: customer.id, label: customer.name, detail: formatBalances(customer.ledger.balancesByCurrency) }))
    if (form.targetType === 'contact') return data.contacts.map((contact) => ({ id: contact.id, label: contact.name, detail: contact.type }))
    if (form.targetType === 'sale') return data.sales.map((sale) => ({ id: sale.id, label: productName(sale.productId, data.products), detail: `Due ${formatMoney(sale.balanceDue)}` }))
    return data.holds.map((hold) => ({ id: hold.id, label: productName(hold.productId, data.products), detail: `${hold.remainingQuantity} left, due ${formatMoney(hold.balanceDueMoney || hold.balanceDue, hold.currency)}` }))
  }, [data.contacts, data.customers, data.holds, data.products, data.sales, form.targetType])

  return (
    <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Panel title="Record payment" description="Select a customer, contact, sale, or hold from current records.">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            mutate('payment', async () => {
              await apiRequest('/api/payments', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
              setForm({ targetType: 'customer', targetId: '', amount: '0', currency: 'USD', customerId: '', contactId: '', note: '' })
            })
          }}
        >
          <Field label="Target type">
            <select value={form.targetType} onChange={(event) => setForm({ ...form, targetType: event.target.value as typeof form.targetType, targetId: '' })} className={inputClass()}>
              <option value="customer">Customer</option>
              <option value="contact">Contact</option>
              <option value="sale">Sale</option>
              <option value="hold">Hold</option>
            </select>
          </Field>
          <Field label="Target">
            <select required value={form.targetId} onChange={(event) => setForm({ ...form, targetId: event.target.value })} className={inputClass()}>
              <option value="">Select {form.targetType}</option>
              {targetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} - {option.detail}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount">
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={inputClass()} />
            </Field>
            <Field label="Currency">
              <CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} />
            </Field>
          </div>
          <Button loading={saving === 'payment'} icon={HandCoins}>
            Record payment
          </Button>
        </form>
      </Panel>
      <Panel title="Payment history" description="Recorded payments across customers, contacts, holds, and sales.">
        <SimpleRows icon={CreditCard} rows={data.payments.map((payment) => [formatMoney(payment.amount), `${payment.targetType}: ${payment.targetId}`, dateShort(payment.createdAt)])} empty="No payments yet." />
      </Panel>
    </section>
  )
}

function CablesView({ data, token, mutate, saving }: ViewProps) {
  const customers = data.contacts.filter((contact) => contact.type === 'customer')
  const [rollForm, setRollForm] = useState({ productId: '', rollCode: '', cableType: 'Cat6', categoryId: '', color: '', originalMeters: '305', costPerMeter: '0', salePricePerMeter: '0', currency: 'USD' as Currency, location: '', lowMeterAlert: '15', notes: '' })
  const [cuts, setCuts] = useState<Record<string, { meters: string; pricePerMeter: string; destinationType: 'sale' | 'hold' | 'use'; responsibleContactId: string; finalCustomerId: string; currency: Currency }>>({})

  return (
    <section className="space-y-5">
      <Panel title="Create cable roll" description="Register a new roll and meter alert threshold.">
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
            })
          }}
        >
          <Field label="Product">
            <select required value={rollForm.productId} onChange={(event) => setRollForm({ ...rollForm, productId: event.target.value })} className={inputClass()}>
              <option value="">Select</option>
              {data.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Roll code">
            <input required value={rollForm.rollCode} onChange={(event) => setRollForm({ ...rollForm, rollCode: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Type">
            <input value={rollForm.cableType} onChange={(event) => setRollForm({ ...rollForm, cableType: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Meters">
            <input type="number" min="1" value={rollForm.originalMeters} onChange={(event) => setRollForm({ ...rollForm, originalMeters: event.target.value })} className={inputClass()} />
          </Field>
          <Field label="Sale/m">
            <input type="number" min="0" step="0.01" value={rollForm.salePricePerMeter} onChange={(event) => setRollForm({ ...rollForm, salePricePerMeter: event.target.value })} className={inputClass()} />
          </Field>
          <div className="flex items-end">
            <Button loading={saving === 'roll'} icon={Cable} className="w-full">
              Create
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Cable rolls" description="Cut meters into sales, holds, or internal usage.">
        <div className="space-y-3">
          {data.cableRolls.map((roll) => {
            const cut = cuts[roll.id] || { meters: '', pricePerMeter: String(roll.salePricePerMeter.amount), destinationType: 'sale' as const, responsibleContactId: '', finalCustomerId: '', currency: roll.salePricePerMeter.currency }
            return (
              <div key={roll.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{roll.rollCode} - {roll.cableType}</p>
                    <p className="text-sm text-slate-500">{roll.remainingMeters}m left from {roll.originalMeters}m - {roll.location || 'No location'}</p>
                  </div>
                  {roll.remainingMeters <= roll.lowMeterAlert ? <StatusPill tone="warning">Low roll</StatusPill> : <StatusPill tone="success">Ready</StatusPill>}
                </div>
                <div className="mt-4 grid gap-2 lg:grid-cols-6">
                  <select value={cut.destinationType} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, destinationType: event.target.value as typeof cut.destinationType } })} className={inputClass()}>
                    <option value="sale">Sale</option>
                    <option value="hold">Hold/use</option>
                    <option value="use">Internal use</option>
                  </select>
                  <input type="number" min="0" placeholder="Meters" value={cut.meters} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, meters: event.target.value } })} className={inputClass()} />
                  <input type="number" min="0" step="0.01" placeholder="Price/m" value={cut.pricePerMeter} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, pricePerMeter: event.target.value } })} className={inputClass()} />
                  <select value={cut.responsibleContactId} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, responsibleContactId: event.target.value } })} className={inputClass()}>
                    <option value="">Responsible</option>
                    {data.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                  <select value={cut.finalCustomerId} onChange={(event) => setCuts({ ...cuts, [roll.id]: { ...cut, finalCustomerId: event.target.value } })} className={inputClass()}>
                    <option value="">Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" variant="secondary" icon={Scissors} loading={saving === `cut-${roll.id}`} onClick={() => mutate(`cut-${roll.id}`, async () => apiRequest(`/api/cables/rolls/${roll.id}/cut`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ ...cut, meters: Number(cut.meters), pricePerMeter: Number(cut.pricePerMeter) }) }))}>
                    Cut
                  </Button>
                </div>
              </div>
            )
          })}
          {data.cableRolls.length === 0 ? <EmptyState title="No cable rolls yet." description="Create a roll before cutting meters." icon={Cable} /> : null}
        </div>
      </Panel>
    </section>
  )
}
