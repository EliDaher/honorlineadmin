'use client'

import type { FormEvent } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button, CurrencySelect, Field, inputClass } from '@/app/_components/ui'
import type { SalesViewData, SaleFormValues } from '../types/sales.types'
import { getCustomers } from '../utils/salesCalculations'

type SaleFormProps = {
  data: SalesViewData
  form: SaleFormValues
  onChange: (nextForm: SaleFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  saving: boolean
}

export function SaleForm({ data, form, onChange, onSubmit, saving }: SaleFormProps) {
  const customers = getCustomers(data.contacts)

  return (
    <form className="grid gap-3 lg:grid-cols-7" onSubmit={onSubmit}>
      <Field label="المنتج">
        <select
          required
          value={form.productId}
          onChange={(event) => {
            const product = data.products.find((item) => item.id === event.target.value)
            onChange({ ...form, productId: event.target.value, unitPrice: product ? String(product.salePrice) : form.unitPrice, currency: product?.currency || form.currency })
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
        <select value={form.responsibleContactId} onChange={(event) => onChange({ ...form, responsibleContactId: event.target.value })} className={inputClass()}>
          <option value="">بدون</option>
          {data.contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="الزبون">
        <select value={form.finalCustomerId} onChange={(event) => onChange({ ...form, finalCustomerId: event.target.value })} className={inputClass()}>
          <option value="">بدون</option>
          {customers.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="الكمية">
        <input type="number" min="1" value={form.quantity} onChange={(event) => onChange({ ...form, quantity: event.target.value })} className={inputClass()} />
      </Field>
      <Field label="السعر">
        <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(event) => onChange({ ...form, unitPrice: event.target.value })} className={inputClass()} />
      </Field>
      <Field label="العملة">
        <CurrencySelect value={form.currency} onChange={(currency) => onChange({ ...form, currency })} />
      </Field>
      <div className="flex items-end">
        <Button loading={saving} icon={ShoppingCart} className="w-full">
          إنشاء
        </Button>
      </div>
    </form>
  )
}
