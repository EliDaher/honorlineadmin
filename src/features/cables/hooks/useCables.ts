'use client'
import { useCallback } from 'react'
import { getCablesPageData } from '../services/cablesApi'
export function useCables() { return useCallback((token: string) => getCablesPageData(token), []) }
