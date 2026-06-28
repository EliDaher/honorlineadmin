'use client'
import { useCallback } from 'react'
import { getPaymentsPageData } from '../services/paymentsApi'
export function usePayments() { return useCallback((token: string) => getPaymentsPageData(token), []) }
