'use client'

import { useCallback } from 'react'
import { getSalesPageData } from '../services/salesApi'

export function useSales() {
  return useCallback((token: string) => getSalesPageData(token), [])
}
