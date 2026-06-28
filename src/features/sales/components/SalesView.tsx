'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { Save } from 'lucide-react'
import type { InventoryAppViewProps } from '@/app/_components/inventory-app'
import type { Sale } from '@/app/_lib/types'
import { Button, Field, Modal, inputClass } from '@/app/_components/ui'
import { useCreateSale } from '../hooks/useCreateSale'
import { useRecordSalePayment } from '../hooks/useRecordSalePayment'
import { deleteSale, updateSale } from '../services/salesApi'
import type { SaleFormValues } from '../types/sales.types'
import { SaleModal } from './SaleModal'
import { SalesTable } from './SalesTable'

const initialSaleForm: SaleFormValues = {
  productId: '',
  responsibleContactId: '',
  finalCustomerId: '',
  quantity: '1',
  unitPrice: '0',
  currency: 'USD',
  note: ''
}

type SaleEditForm = Pick<SaleFormValues, 'responsibleContactId' | 'finalCustomerId' | 'note'>
const initialEditForm: SaleEditForm = { responsibleContactId: '', finalCustomerId: '', note: '' }

export function SalesView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const [form, setForm] = useState<SaleFormValues>(initialSaleForm)
  const [editForm, setEditForm] = useState<SaleEditForm>(initialEditForm)
  const [editingId, setEditingId] = useState('')
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({})
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const createSale = useCreateSale(token)
  const recordPayment = useRecordSalePayment(token)
  const customers = data.contacts.filter((contact) => contact.type === 'customer')

  function handleCreateSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutate('sale', async () => {
      await createSale({ ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice) })
      setForm(initialSaleForm)
      setIsSaleModalOpen(false)
    })
  }

  function handlePayment(saleId: string, currency: SaleFormValues['currency']) {
    mutate(`sale-pay-${saleId}`, async () => {
      await recordPayment(saleId, { amount: Number(paymentAmounts[saleId] || 0), currency })
    })
  }

  function openEditSale(sale: Sale) {
    setEditingId(sale.id)
    setEditForm({ responsibleContactId: sale.responsibleContactId, finalCustomerId: sale.finalCustomerId, note: sale.note })
    setIsEditModalOpen(true)
  }

  function submitEditSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutate(`sale-${editingId}`, async () => {
      await updateSale(token, editingId, editForm)
      setEditingId('')
      setEditForm(initialEditForm)
      setIsEditModalOpen(false)
    })
  }

  function removeSale(sale: Sale) {
    if (!window.confirm(`حذف عملية البيع ${sale.id}؟`)) return
    mutate(`delete-sale-${sale.id}`, () => deleteSale(token, sale.id))
  }

  return (
    <section className="space-y-5">
      <SaleModal open={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} data={data} form={form} onChange={setForm} onSubmit={handleCreateSale} saving={saving === 'sale'} />

      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="تعديل بيع">
        <form className="space-y-4" onSubmit={submitEditSale}>
          <Field label="المسؤول">
            <select value={editForm.responsibleContactId} onChange={(event) => setEditForm({ ...editForm, responsibleContactId: event.target.value })} className={inputClass()}>
              <option value="">بدون</option>
              {data.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
            </select>
          </Field>
          <Field label="الزبون">
            <select value={editForm.finalCustomerId} onChange={(event) => setEditForm({ ...editForm, finalCustomerId: event.target.value })} className={inputClass()}>
              <option value="">بدون</option>
              {customers.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
            </select>
          </Field>
          <Field label="ملاحظات"><textarea value={editForm.note} onChange={(event) => setEditForm({ ...editForm, note: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === `sale-${editingId}`} icon={Save}>حفظ التعديل</Button>
        </form>
      </Modal>

      <SalesTable
        data={data}
        paymentAmounts={paymentAmounts}
        onPaymentAmountChange={(saleId, amount) => setPaymentAmounts({ ...paymentAmounts, [saleId]: amount })}
        onPayment={(sale) => handlePayment(sale.id, sale.total.currency)}
        onCreateSale={() => setIsSaleModalOpen(true)}
        onEditSale={openEditSale}
        onDeleteSale={removeSale}
        savingAction={saving}
      />
    </section>
  )
}
