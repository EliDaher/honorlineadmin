import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, CustomerDetail, InventoryData, WorkerDetail } from '@/app/_lib/types'
import { getUsers } from '@/features/users/services/usersApi'

export async function getWorkersPageData(token: string): Promise<Pick<InventoryData, 'workers' | 'users'>> {
  const [workers, users] = await Promise.all([
    apiRequest<ApiResponse<WorkerDetail[]>>('/api/workers', { headers: authHeaders(token) }),
    getUsers(token)
  ])
  return { workers: workers.data, users: users.data }
}

export function getCustomersPageData(token: string): Promise<Pick<InventoryData, 'customers'>> {
  return apiRequest<ApiResponse<CustomerDetail[]>>('/api/customers', { headers: authHeaders(token) }).then((response) => ({ customers: response.data }))
}
