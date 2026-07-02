'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCurrentUser, TOKEN_STORAGE_KEY } from '@/app/_lib/api'
import type { User } from '@/app/_lib/types'
import { emptyData } from '@/features/shared/constants/inventory'
import type { ViewDataLoader } from '../types'

export function useInventoryPage(loadViewData: ViewDataLoader) {
  const [ready, setReady] = useState(false)
  const [token, setToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError('')
    try {
      const viewData = await loadViewData(token)
      setData({ ...emptyData, ...viewData })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل بيانات الصفحة')
    } finally {
      setLoading(false)
    }
  }, [loadViewData, token])

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (savedToken) {
      setToken(savedToken)
      getCurrentUser(savedToken)
        .then((response) => setUser(response.data))
        .catch(() => {
          localStorage.removeItem(TOKEN_STORAGE_KEY)
          setToken('')
          setUser(null)
        })
    }
    setReady(true)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function login(tokenValue: string, userValue: User) {
    setToken(tokenValue)
    setUser(userValue)
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
    setUser(null)
    setData(emptyData)
  }

  async function mutate(action: string, run: () => Promise<unknown>) {
    setSaving(action)
    setError('')
    try {
      await run()
      await loadData()
      setSuccess('تم الحفظ بنجاح')
      window.setTimeout(() => setSuccess(''), 2200)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'فشلت العملية')
    } finally {
      setSaving('')
    }
  }

  return { ready, token, user, data, loading, saving, error, success, loadData, login, logout, mutate }
}
