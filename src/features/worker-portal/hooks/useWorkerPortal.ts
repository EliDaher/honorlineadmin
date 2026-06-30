import { useCallback } from 'react'
import { getWorkerPortalData } from '../services/workerPortalApi'

export function useWorkerPortal() {
  return useCallback((token: string) => getWorkerPortalData(token), [])
}
