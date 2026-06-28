'use client'
import { useCallback } from 'react'
import { getCategoriesPageData } from '../services/categoriesApi'
export function useCategories() { return useCallback((token: string) => getCategoriesPageData(token), []) }
