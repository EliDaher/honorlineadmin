import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, HoldRequest, InventoryData, WorkerDetail, WorkerProduct } from '@/app/_lib/types'

export async function getWorkerPortalData(token: string): Promise<Pick<InventoryData, 'currentWorker' | 'workerProducts' | 'holdRequests'>> {
  const headers = authHeaders(token)
  const [currentWorker, workerProducts, holdRequests] = await Promise.all([
    apiRequest<ApiResponse<WorkerDetail>>('/api/worker/me', { headers }),
    apiRequest<ApiResponse<WorkerProduct[]>>('/api/worker/products', { headers }),
    apiRequest<ApiResponse<HoldRequest[]>>('/api/hold-requests', { headers })
  ])

  return {
    currentWorker: currentWorker.data,
    workerProducts: workerProducts.data,
    holdRequests: holdRequests.data
  }
}
