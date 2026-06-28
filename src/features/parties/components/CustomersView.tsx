'use client'

import { useState, type FormEvent } from 'react'
import { UsersRound } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { CustomerDetail } from '@/app/_lib/types'
import { Button, Field, Modal, Panel, RowActions, inputClass } from '@/app/_components/ui'
import { formatBalances } from '@/app/_lib/format'
import { SimpleRows } from '@/features/shared/components/SimpleRows'
import { deleteContact, updateContact, type CreateContactInput } from '@/features/contacts/services/contactsApi'

const initialForm: CreateContactInput = { type: 'customer', name: '', phone: '', address: '', notes: '' }

export function CustomersView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [open, setOpen] = useState(false)

  function openEdit(customer: CustomerDetail) {
    setForm({ type: 'customer', name: customer.name, phone: customer.phone, address: customer.address, notes: customer.notes })
    setEditingId(customer.id)
    setOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(`customer-${editingId}`, async () => {
      await updateContact(token, editingId, form)
      setOpen(false)
      setEditingId('')
      setForm(initialForm)
    })
  }

  async function remove(customer: CustomerDetail) {
    if (!window.confirm(`حذف الزبون "${customer.name}"؟`)) return
    await mutate(`delete-customer-${customer.id}`, () => deleteContact(token, customer.id))
  }

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} title="تعديل زبون">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="الاسم"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} /></Field>
          <Field label="الهاتف"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass()} /></Field>
          <Field label="العنوان"><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass()} /></Field>
          <Field label="ملاحظات"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === `customer-${editingId}`} icon={UsersRound}>حفظ التعديل</Button>
        </form>
      </Modal>

      <Panel title="دفتر ديون الزبائن" description="الأرصدة المفتوحة وحركة المبيعات لكل زبون.">
        <SimpleRows
          icon={UsersRound}
          rows={data.customers.map((customer) => [customer.name, `الدين ${formatBalances(customer.ledger.balancesByCurrency)}`, `${customer.ledger.salesAsCustomer.length} عملية بيع`])}
          actions={data.customers.map((customer) => (
            <RowActions key={customer.id} onEdit={() => openEdit(customer)} onDelete={() => remove(customer)} editLoading={saving === `customer-${customer.id}`} deleteLoading={saving === `delete-customer-${customer.id}`} />
          ))}
          empty="لا يوجد زبائن بعد. أنشئ جهة من نوع زبون أولاً."
        />
      </Panel>
    </>
  )
}
