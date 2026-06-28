'use client'
import { useCallback } from 'react'
import { getHoldsPageData } from '../services/holdsApi'
export function useHolds() { return useCallback((token: string) => getHoldsPageData(token), []) }
