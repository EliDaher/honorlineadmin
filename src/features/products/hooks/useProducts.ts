'use client'
import { useCallback } from 'react'
import { getProductsPageData } from '../services/productsApi'
export function useProducts() { return useCallback((token: string) => getProductsPageData(token), []) }
