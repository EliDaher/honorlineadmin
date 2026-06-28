'use client'

import { useState, type FormEvent } from 'react'
import { Cable, Scissors } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import type { CableRoll, Currency } from '@/app/_lib/types'
import { Button, CurrencySelect, EmptyState, Field, Modal, Panel, RowActions, StatusPill, inputClass } from '@/app/_components/ui'
import { CategorySelect } from '@/features/shared/components/CategorySelect'
import { createCableRoll, cutCableRoll, deleteCableRoll, updateCableRoll, type CreateCableRollInput, type CutCableInput } from '../services/cablesApi'

type RollForm = Omit<CreateCableRollInput, 'originalMeters' | 'costPerMeter' | 'salePricePerMeter' | 'lowMeterAlert'> & {
  originalMeters: string
  costPerMeter: string
  salePricePerMeter: string
  lowMeterAlert: string
}
type CutForm = Omit<CutCableInput, 'meters' | 'pricePerMeter'> & { meters: string; pricePerMeter: string }

const initialRoll: RollForm = {
  productId: '',
  rollCode: '',
  cableType: 'Cat6',
  categoryId: '',
  color: '',
  originalMeters: '305',
  costPerMeter: '0',
  salePricePerMeter: '0',
  currency: 'USD',
  location: '',
  lowMeterAlert: '15',
  notes: ''
}

function rollToForm(roll: CableRoll): RollForm {
  return {
    productId: roll.productId,
    rollCode: roll.rollCode,
    cableType: roll.cableType,
    categoryId: roll.categoryId,
    color: roll.color,
    originalMeters: String(roll.originalMeters),
    costPerMeter: String(roll.costPerMeter.amount),
    salePricePerMeter: String(roll.salePricePerMeter.amount),
    currency: roll.salePricePerMeter.currency,
    location: roll.location,
    lowMeterAlert: String(roll.lowMeterAlert),
    notes: roll.notes
  }
}

export function CablesView({ data, token, mutate, saving }: InventoryAppViewProps) {
  const customers = data.contacts.filter((contact) => contact.type === 'customer')
  const [rollForm, setRollForm] = useState(initialRoll)
  const [cuts, setCuts] = useState<Record<string, CutForm>>({})
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')

  function openCreate() {
    setRollForm(initialRoll)
    setEditingId('')
    setOpen(true)
  }

  function openEdit(roll: CableRoll) {
    setRollForm(rollToForm(roll))
    setEditingId(roll.id)
    setOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await mutate(editingId ? `roll-${editingId}` : 'roll', async () => {
      const payload = {
        ...rollForm,
        costPerMeter: Number(rollForm.costPerMeter),
        salePricePerMeter: Number(rollForm.salePricePerMeter),
        lowMeterAlert: Number(rollForm.lowMeterAlert)
      }

      if (editingId) await updateCableRoll(token, editingId, payload)
      else await createCableRoll(token, { ...payload, originalMeters: Number(rollForm.originalMeters) })
      setRollForm(initialRoll)
      setEditingId('')
      setOpen(false)
    })
  }

  async function remove(roll: CableRoll) {
    if (!window.confirm(`حذف رول الكابل "${roll.rollCode}"؟`)) return
    await mutate(`delete-roll-${roll.id}`, () => deleteCableRoll(token, roll.id))
  }

  return (
    <section className="space-y-5">
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'تعديل رول كابل' : 'إنشاء رول كابل'} description="سجل رولاً جديداً وحدد حد التنبيه بالمتر." size="lg">
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-3 lg:grid-cols-3">
            {!editingId ? (
              <Field label="المنتج">
                <select required value={rollForm.productId} onChange={(event) => setRollForm({ ...rollForm, productId: event.target.value })} className={inputClass()}>
                  <option value="">اختر</option>
                  {data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </Field>
            ) : null}
            <Field label="رمز الرول"><input required value={rollForm.rollCode} onChange={(event) => setRollForm({ ...rollForm, rollCode: event.target.value })} className={inputClass()} /></Field>
            <Field label="النوع"><input value={rollForm.cableType} onChange={(event) => setRollForm({ ...rollForm, cableType: event.target.value })} className={inputClass()} /></Field>
            <Field label="التصنيف"><CategorySelect categories={data.categories} value={rollForm.categoryId} onChange={(categoryId) => setRollForm({ ...rollForm, categoryId })} /></Field>
          </div>
          <div className="grid gap-3 lg:grid-cols-4">
            {!editingId ? <Field label="الأمتار"><input type="number" min="1" value={rollForm.originalMeters} onChange={(event) => setRollForm({ ...rollForm, originalMeters: event.target.value })} className={inputClass()} /></Field> : null}
            <Field label="تكلفة المتر"><input type="number" min="0" step="0.01" value={rollForm.costPerMeter} onChange={(event) => setRollForm({ ...rollForm, costPerMeter: event.target.value })} className={inputClass()} /></Field>
            <Field label="سعر المتر"><input type="number" min="0" step="0.01" value={rollForm.salePricePerMeter} onChange={(event) => setRollForm({ ...rollForm, salePricePerMeter: event.target.value })} className={inputClass()} /></Field>
            <Field label="العملة"><CurrencySelect value={rollForm.currency} onChange={(currency) => setRollForm({ ...rollForm, currency })} /></Field>
            <Field label="تنبيه منخفض"><input type="number" min="0" value={rollForm.lowMeterAlert} onChange={(event) => setRollForm({ ...rollForm, lowMeterAlert: event.target.value })} className={inputClass()} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اللون"><input value={rollForm.color} onChange={(event) => setRollForm({ ...rollForm, color: event.target.value })} className={inputClass()} /></Field>
            <Field label="الموقع"><input value={rollForm.location} onChange={(event) => setRollForm({ ...rollForm, location: event.target.value })} className={inputClass()} /></Field>
          </div>
          <Field label="ملاحظات"><textarea value={rollForm.notes} onChange={(event) => setRollForm({ ...rollForm, notes: event.target.value })} className={inputClass()} rows={3} /></Field>
          <Button loading={saving === (editingId ? `roll-${editingId}` : 'roll')} icon={Cable}>{editingId ? 'حفظ التعديل' : 'إنشاء'}</Button>
        </form>
      </Modal>

      <Panel title="رولات الكابل" description="قص الأمتار كمبيعات أو أمانات أو استخدام داخلي." actions={<Button type="button" icon={Cable} onClick={openCreate}>إنشاء رول كابل</Button>}>
        <div className="space-y-3">
          {data.cableRolls.map((roll) => {
            const cut = cuts[roll.id] || {
              meters: '',
              pricePerMeter: String(roll.salePricePerMeter.amount),
              destinationType: 'sale' as const,
              responsibleContactId: '',
              finalCustomerId: '',
              currency: roll.salePricePerMeter.currency
            }

            function updateCut(change: Partial<CutForm>) {
              setCuts({ ...cuts, [roll.id]: { ...cut, ...change } })
            }

            return (
              <div key={roll.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{roll.rollCode} - {roll.cableType}</p>
                    <p className="text-sm text-slate-500">{roll.remainingMeters} م متبقي من {roll.originalMeters} م - {roll.location || 'لا يوجد موقع'}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {roll.remainingMeters <= roll.lowMeterAlert ? <StatusPill tone="warning">رول منخفض</StatusPill> : <StatusPill tone="success">جاهز</StatusPill>}
                    <RowActions onEdit={() => openEdit(roll)} onDelete={() => remove(roll)} editLoading={saving === `roll-${roll.id}`} deleteLoading={saving === `delete-roll-${roll.id}`} />
                  </div>
                </div>
                <div className="mt-4 grid gap-2 lg:grid-cols-6">
                  <select value={cut.destinationType} onChange={(event) => updateCut({ destinationType: event.target.value as CutForm['destinationType'] })} className={inputClass()}><option value="sale">بيع</option><option value="hold">أمانة / استخدام</option><option value="use">استخدام داخلي</option></select>
                  <input type="number" min="0" placeholder="الأمتار" value={cut.meters} onChange={(event) => updateCut({ meters: event.target.value })} className={inputClass()} />
                  <input type="number" min="0" step="0.01" placeholder="سعر المتر" value={cut.pricePerMeter} onChange={(event) => updateCut({ pricePerMeter: event.target.value })} className={inputClass()} />
                  <select value={cut.responsibleContactId} onChange={(event) => updateCut({ responsibleContactId: event.target.value })} className={inputClass()}><option value="">المسؤول</option>{data.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select>
                  <select value={cut.finalCustomerId} onChange={(event) => updateCut({ finalCustomerId: event.target.value })} className={inputClass()}><option value="">الزبون</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select>
                  <Button type="button" variant="secondary" icon={Scissors} loading={saving === `cut-${roll.id}`} onClick={() => mutate(`cut-${roll.id}`, () => cutCableRoll(token, roll.id, { ...cut, meters: Number(cut.meters), pricePerMeter: Number(cut.pricePerMeter), currency: cut.currency as Currency }))}>قص</Button>
                </div>
              </div>
            )
          })}
          {data.cableRolls.length === 0 ? <EmptyState title="لا توجد رولات كابل بعد." description="أنشئ رولاً قبل قص الأمتار." icon={Cable} /> : null}
        </div>
      </Panel>
    </section>
  )
}
