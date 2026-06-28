'use client'
import { useCallback } from 'react'
import { getCustomersPageData, getWorkersPageData } from '../services/partiesApi'
export function useWorkers() { return useCallback((token: string) => getWorkersPageData(token), []) }
export function useCustomers() { return useCallback((token: string) => getCustomersPageData(token), []) }
