'use client'

import { useCallback } from 'react'
import { createSale } from '../services/salesApi'
import type { CreateSaleInput } from '../types/sales.types'

export function useCreateSale(token: string) {
  return useCallback((input: CreateSaleInput) => createSale(token, input), [token])
}
