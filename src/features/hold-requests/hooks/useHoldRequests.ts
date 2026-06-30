import { useCallback } from 'react'
import { getHoldRequestsPageData } from '../services/holdRequestsApi'

export function useHoldRequests() {
  return useCallback((token: string) => getHoldRequestsPageData(token), [])
}
