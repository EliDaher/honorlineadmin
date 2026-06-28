'use client'
import { useCallback } from 'react'
import { getAccountingPageData } from '../services/accountingApi'
export function useAccounting() { return useCallback((token: string) => getAccountingPageData(token), []) }
