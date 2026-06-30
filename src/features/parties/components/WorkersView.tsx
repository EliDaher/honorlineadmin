'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { AppUser, WorkerDetail } from '@/app/_lib/types'
import { Button, Field, Modal, Panel, RowActions, StatusPill, inputClass } from '@/app/_components/ui'
import { formatBalances } from '@/app/_lib/format'
import { SimpleRows } from '@/features/shared/components/SimpleRows'
import { deleteContact, updateContact, type CreateContactInput } from '@/features/contacts/services/contactsApi'
import { createUser, updateUser } from '@/features/users/services/usersApi'

const initialForm: CreateContactInput = { type: 'worker', name: '', phone: '', address: '', notes: '' }
const initialAccountForm = { username: '', password: '', isActive: true }

function accountStatus(account?: AppUser) {
  if (!account) return 'لا يوجد حساب'
  return account.isActive ? 'حساب فعال' : 'حساب موقوف'
}

export function WorkersView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState(initialForm)
  const [accountForm, setAccountForm] = useState(initialAccountForm)
  const [editingId, setEditingId] = useState('')
  const [open, setOpen] = useState(false)
  const editingAccount = editingId ? data.users.find((user) => user.role === 'worker' && user.contactId === editingId) : undefined

  function workerAccount(workerId: string) {
    return data.users.find((user) => user.role === 'worker' && user.contactId === workerId)
  }

  function openEdit(worker: WorkerDetail) {
    const account = workerAccount(worker.id)
    setForm({ type: 'worker', name: worker.name, phone: worker.phone, address: worker.address, notes: worker.notes })
    setAccountForm({ username: account?.username || '', password: '', isActive: account?.isActive ?? true })
    setEditingId(worker.id)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditingId('')
    setForm(initialForm)
    setAccountForm(initialAccountForm)
  }

  async function saveAccount() {
    const username = accountForm.username.trim()
    const password = accountForm.password

    if (!editingAccount && !username && !password) return
    if (!editingAccount && (!username || !password)) throw new Error('أدخل اسم المستخدم وكلمة المرور لإنشاء حساب العامل.')
    if (editingAccount && !username) throw new Error('اسم المستخدم مطلوب للحساب.')

    if (editingAccount) {
      await updateUser(token, editingAccount.id, {
        username,
        password: password || undefined,
        role: 'worker',
        contactId: editingId,
        isActive: accountForm.isActive
      })
      return
    }

    await createUser(token, {
      username,
      password,
      role: 'worker',
      contactId: editingId,
      isActive: accountForm.isActive
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(`worker-${editingId}`, async () => {
      await updateContact(token, editingId, form)
      await saveAccount()
      closeModal()
    })
  }

  async function remove(worker: WorkerDetail) {
    if (!window.confirm(`حذف العامل "${worker.name}"؟`)) return
    await mutate(`delete-worker-${worker.id}`, () => deleteContact(token, worker.id))
  }

  return (
    <>
      <Modal open={open} onClose={closeModal} title="تعديل عامل" size="lg">
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="الاسم"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass()} /></Field>
            <Field label="الهاتف"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass()} /></Field>
          </div>
          <Field label="العنوان"><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className={inputClass()} /></Field>
          <Field label="ملاحظات"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={inputClass()} rows={3} /></Field>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-cyan-700" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-950">حساب دخول العامل</p>
              <StatusPill tone={editingAccount?.isActive ? 'success' : editingAccount ? 'warning' : 'neutral'}>{accountStatus(editingAccount)}</StatusPill>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اسم المستخدم"><input value={accountForm.username} onChange={(event) => setAccountForm({ ...accountForm, username: event.target.value })} className={inputClass()} autoComplete="username" /></Field>
              <Field label={editingAccount ? 'كلمة مرور جديدة' : 'كلمة المرور'} hint={editingAccount ? 'اتركها فارغة إذا لا تريد تغييرها.' : undefined}>
                <input type="password" value={accountForm.password} onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })} className={inputClass()} autoComplete="new-password" />
              </Field>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={accountForm.isActive} onChange={(event) => setAccountForm({ ...accountForm, isActive: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-200" />
              الحساب فعال
            </label>
          </section>

          <Button loading={saving === `worker-${editingId}`} icon={ShieldCheck}>حفظ التعديل</Button>
        </form>
      </Modal>

      <Panel title="تفاصيل العاملين" description="عدد الأمانات والأرصدة المفتوحة لكل عامل، مع حالة حساب الدخول.">
        <SimpleRows
          icon={ShieldCheck}
          rows={data.workers.map((worker) => {
            const account = workerAccount(worker.id)
            return [
              worker.name,
              `${worker.detail.itemsInCustody} مواد في الأمانة - ${accountStatus(account)}`,
              `الرصيد ${formatBalances(worker.detail.balancesByCurrency)}`,
            ]
          })}
          actions={data.workers.map((worker) => (
            <RowActions key={worker.id} onEdit={() => openEdit(worker)} onDelete={() => remove(worker)} editLoading={saving === `worker-${worker.id}`} deleteLoading={saving === `delete-worker-${worker.id}`} />
          ))}
          empty="لا يوجد عاملون بعد. أنشئ جهة من نوع عامل أولا."
        />
      </Panel>
    </>
  )
}
