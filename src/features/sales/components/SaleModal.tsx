'use client'

import type { FormEvent } from 'react'
import { Modal } from '@/app/_components/ui'
import { SaleForm } from './SaleForm'
import type { SalesViewData, SaleFormValues } from '../types/sales.types'

type SaleModalProps = {
  open: boolean
  onClose: () => void
  data: SalesViewData
  form: SaleFormValues
  onChange: (nextForm: SaleFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  saving: boolean
}

export function SaleModal({ open, onClose, data, form, onChange, onSubmit, saving }: SaleModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="بيع مباشر" description="أنشئ عملية بيع مع ربط اختياري بالمسؤول أو الزبون." size="lg">
      <SaleForm data={data} form={form} onChange={onChange} onSubmit={onSubmit} saving={saving} />
    </Modal>
  )
}
