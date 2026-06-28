'use client'
import { useCallback } from 'react'
import { getDashboardPageData } from '../services/dashboardApi'
export function useDashboard() { return useCallback((token: string) => getDashboardPageData(token), []) }
