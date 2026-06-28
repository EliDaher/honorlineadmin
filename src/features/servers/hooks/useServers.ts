'use client'

import { useCallback } from 'react'
import { getServersPageData } from '../services/serversApi'

export function useServers() {
  return useCallback((token: string) => getServersPageData(token), [])
}
