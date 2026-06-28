'use client'

import { useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { WorkerDetail } from '@/app/_lib/types'
import { Button, Field, Modal, Panel, RowActions, inputClass } from '@/app/_components/ui'
import { formatBalances } from '@/app/_lib/format'
import { SimpleRows } from '@/features/shared/components/SimpleRows'
import { deleteContact, updateContact, type CreateContactInput } from '@/features/contacts/services/contactsApi'

const initialForm: CreateContactInput = { type: 'worker', name: '', phone: '', address: '', notes: '' }

export function WorkersView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState('')
  const [open, setOpen] = useState(false)

  function openEdit(worker: WorkerDetail) {
    setForm({ type: 'worker', name: worker.name, phone: worker.phone, address: worker.address, notes: worker.notes })
    setEditingId(worker.id)
    setOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(`worker-${editingId}`, async () => {
      await updateContact(token, editingId, form)
      setOpen(false)
      setEditingId('')
      setForm(initialForm)
    })
  }

  async function remove(worker: WorkerDetail) {
    if (!window.confirm(`حذف العامل "${worker.name}"؟`)) return
    await mutate(`delete-worker-${worker.id}`, () => deleteContact(token, worker.id))
  }

  return (
    <>
      <Modal open={open} onClose={() => setOpen(false)} title="تعديل عامل">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="الاسم"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} /></Field>
          <Field label="الهاتف"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass()} /></Field>
          <Field label="العنوان"><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass()} /></Field>
          <Field label="ملاحظات"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === `worker-${editingId}`} icon={ShieldCheck}>حفظ التعديل</Button>
        </form>
      </Modal>

      <Panel title="تفاصيل العاملين" description="عدد الأمانات والأرصدة المفتوحة لكل عامل.">
        <SimpleRows
          icon={ShieldCheck}
          rows={data.workers.map((worker) => [worker.name, `${worker.detail.itemsInCustody} مواد في الأمانة`, `الرصيد ${formatBalances(worker.detail.balancesByCurrency)}`])}
          actions={data.workers.map((worker) => (
            <RowActions key={worker.id} onEdit={() => openEdit(worker)} onDelete={() => remove(worker)} editLoading={saving === `worker-${worker.id}`} deleteLoading={saving === `delete-worker-${worker.id}`} />
          ))}
          empty="لا يوجد عاملون بعد. أنشئ جهة من نوع عامل أولاً."
        />
      </Panel>
    </>
  )
}
