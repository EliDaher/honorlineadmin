'use client'

import { useCallback } from 'react'
import { recordSalePayment } from '../services/salesApi'
import type { RecordSalePaymentInput } from '../types/sales.types'

export function useRecordSalePayment(token: string) {
  return useCallback((saleId: string, input: RecordSalePaymentInput) => recordSalePayment(token, saleId, input), [token])
}
