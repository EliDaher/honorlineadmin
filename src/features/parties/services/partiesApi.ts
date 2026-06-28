import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, CustomerDetail, InventoryData, WorkerDetail } from '@/app/_lib/types'

export function getWorkersPageData(token: string): Promise<Pick<InventoryData, 'workers'>> {
  return apiRequest<ApiResponse<WorkerDetail[]>>('/api/workers', { headers: authHeaders(token) }).then((response) => ({ workers: response.data }))
}

export function getCustomersPageData(token: string): Promise<Pick<InventoryData, 'customers'>> {
  return apiRequest<ApiResponse<CustomerDetail[]>>('/api/customers', { headers: authHeaders(token) }).then((response) => ({ customers: response.data }))
}
