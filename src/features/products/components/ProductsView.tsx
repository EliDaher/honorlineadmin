'use client'

import { useState, type FormEvent } from 'react'
import { Boxes, PackagePlus } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { Product } from '@/app/_lib/types'
import { Button, CurrencySelect, EmptyState, Field, Modal, Panel, RowActions, TableShell, inputClass, tableClass, tdClass, thClass } from '@/app/_components/ui'
import { formatMoney } from '@/app/_lib/format'
import { CategorySelect } from '@/features/shared/components/CategorySelect'
import { addProductStock, createProduct, deleteProduct, updateProduct, type CreateProductInput } from '../services/productsApi'

type ProductForm = Omit<CreateProductInput, 'quantityOnHand' | 'costPrice' | 'salePrice'> & { quantityOnHand: string; costPrice: string; salePrice: string }

const initialForm: ProductForm = { name: '', sku: '', category: '', categoryId: '', quantityOnHand: '0', costPrice: '0', salePrice: '0', currency: 'USD', notes: '' }

function toForm(product: Product): ProductForm {
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    categoryId: product.categoryId,
    quantityOnHand: String(product.quantityOnHand),
    costPrice: String(product.costPrice),
    salePrice: String(product.salePrice),
    currency: product.currency,
    notes: product.notes
  }
}

export function ProductsView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState(initialForm)
  const [stock, setStock] = useState<Record<string, string>>({})
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')

  function openCreate() {
    setForm(initialForm)
    setEditingId('')
    setOpen(true)
  }

  function openEdit(product: Product) {
    setForm(toForm(product))
    setEditingId(product.id)
    setOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingId ? `product-${editingId}` : 'product', async () => {
      if (editingId) {
        await updateProduct(token, editingId, {
          name: form.name,
          sku: form.sku,
          category: form.category,
          categoryId: form.categoryId,
          costPrice: Number(form.costPrice),
          salePrice: Number(form.salePrice),
          currency: form.currency,
          notes: form.notes
        })
      } else {
        await createProduct(token, {
          ...form,
          quantityOnHand: Number(form.quantityOnHand),
          costPrice: Number(form.costPrice),
          salePrice: Number(form.salePrice)
        })
      }
      setForm(initialForm)
      setEditingId('')
      setOpen(false)
    })
  }

  async function remove(product: Product) {
    if (!window.confirm(`حذف المنتج "${product.name}"؟`)) return
    await mutate(`delete-product-${product.id}`, () => deleteProduct(token, product.id))
  }

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'تعديل منتج' : 'إنشاء منتج'} description="أدخل بيانات المنتج والسعر والتصنيف." size="lg">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="الاسم"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="رمز المنتج"><input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={inputClass()} /></Field>
            <Field label="العملة"><CurrencySelect value={form.currency} onChange={(currency) => setForm({ ...form, currency })} /></Field>
          </div>
          <Field label="التصنيف"><CategorySelect categories={data.categories} value={form.categoryId} onChange={(categoryId) => setForm({ ...form, categoryId })} /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            {!editingId ? <Field label="الكمية"><input type="number" min="0" value={form.quantityOnHand} onChange={(event) => setForm({ ...form, quantityOnHand: event.target.value })} className={inputClass()} /></Field> : null}
            <Field label="التكلفة"><input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} className={inputClass()} /></Field>
            <Field label="سعر البيع"><input type="number" min="0" step="0.01" value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} className={inputClass()} /></Field>
          </div>
          <Field label="ملاحظات"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === (editingId ? `product-${editingId}` : 'product')} icon={PackagePlus}>{editingId ? 'حفظ التعديل' : 'إنشاء منتج'}</Button>
        </form>
      </Modal>

      <Panel title="المنتجات" description="المخزون والأسعار وإدخال كميات سريع." actions={<Button type="button" icon={PackagePlus} onClick={openCreate}>إنشاء منتج</Button>}>
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
                <th className={thClass()}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className={tdClass('min-w-64')}><p className="font-semibold text-slate-950">{product.name}</p><p className="text-xs text-slate-500">{product.sku || 'بدون رمز'}</p></td>
                  <td className={tdClass()}>{data.categories.find((category) => category.id === product.categoryId)?.name || product.category || 'بدون تصنيف'}</td>
                  <td className={tdClass('font-semibold text-slate-950')}>{product.quantityOnHand}</td>
                  <td className={tdClass()}>{product.quantityOnHold}</td>
                  <td className={tdClass()}>{formatMoney(product.salePrice, product.currency)}</td>
                  <td className={tdClass()}>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1" value={stock[product.id] || ''} onChange={(event) => setStock({ ...stock, [product.id]: event.target.value })} className={inputClass('w-24')} />
                      <Button type="button" variant="secondary" icon={PackagePlus} loading={saving === `stock-${product.id}`} onClick={() => mutate(`stock-${product.id}`, async () => { await addProductStock(token, product.id, Number(stock[product.id] || 0)); setStock({ ...stock, [product.id]: '' }) })}>إضافة</Button>
                    </div>
                  </td>
                  <td className={tdClass()}>
                    <RowActions onEdit={() => openEdit(product)} onDelete={() => remove(product)} editLoading={saving === `product-${product.id}`} deleteLoading={saving === `delete-product-${product.id}`} />
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
