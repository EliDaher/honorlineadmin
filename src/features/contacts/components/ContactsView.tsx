'use client'

import { useState, type FormEvent } from 'react'
import { ContactRound } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { Contact, ContactType } from '@/app/_lib/types'
import { Button, Field, Modal, Panel, RowActions, inputClass } from '@/app/_components/ui'
import { labelContactType } from '@/features/shared/constants/labels'
import { SimpleRows } from '@/features/shared/components/SimpleRows'
import { createContact, deleteContact, updateContact, type CreateContactInput } from '../services/contactsApi'

const initialForm: CreateContactInput = { type: 'dealer', name: '', phone: '', address: '', notes: '' }

export function ContactsView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState(initialForm)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')

  function openCreate() {
    setForm(initialForm)
    setEditingId('')
    setOpen(true)
  }

  function openEdit(contact: Contact) {
    setForm({ type: contact.type, name: contact.name, phone: contact.phone, address: contact.address, notes: contact.notes })
    setEditingId(contact.id)
    setOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingId ? `contact-${editingId}` : 'contact', async () => {
      if (editingId) await updateContact(token, editingId, form)
      else await createContact(token, form)
      setForm(initialForm)
      setEditingId('')
      setOpen(false)
    })
  }

  async function remove(contact: Contact) {
    if (!window.confirm(`حذف الجهة "${contact.name}"؟`)) return
    await mutate(`delete-contact-${contact.id}`, () => deleteContact(token, contact.id))
  }

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'تعديل جهة' : 'إنشاء جهة'} description="أضف الزبائن والعاملين والتجار والموردين.">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="النوع">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ContactType })} className={inputClass()}>
              <option value="dealer">تاجر</option>
              <option value="customer">زبون</option>
              <option value="worker">عامل</option>
              <option value="supplier">مورد</option>
            </select>
          </Field>
          <Field label="الاسم"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} /></Field>
          <Field label="الهاتف"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass()} /></Field>
          <Field label="العنوان"><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass()} /></Field>
          <Field label="ملاحظات"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === (editingId ? `contact-${editingId}` : 'contact')} icon={ContactRound}>{editingId ? 'حفظ التعديل' : 'إنشاء جهة'}</Button>
        </form>
      </Modal>

      <Panel title="الجهات" description="الأشخاص والمؤسسات المستخدمة في المبيعات والأمانات." actions={<Button type="button" icon={ContactRound} onClick={openCreate}>إنشاء جهة</Button>}>
        <SimpleRows
          icon={ContactRound}
          rows={data.contacts.map((contact) => [contact.name, labelContactType(contact.type), contact.phone || 'بدون هاتف'])}
          actions={data.contacts.map((contact) => (
            <RowActions key={contact.id} onEdit={() => openEdit(contact)} onDelete={() => remove(contact)} editLoading={saving === `contact-${contact.id}`} deleteLoading={saving === `delete-contact-${contact.id}`} />
          ))}
          empty="لا توجد جهات بعد."
        />
      </Panel>
    </section>
  )
}
