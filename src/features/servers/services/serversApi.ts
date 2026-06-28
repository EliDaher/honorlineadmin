import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, InventoryData, ManagedServer } from '@/app/_lib/types'

export async function getServersPageData(token: string): Promise<Pick<InventoryData, 'servers'>> {
  const response = await apiRequest<ApiResponse<ManagedServer[]>>('/api/servers', { headers: authHeaders(token) })
  return { servers: response.data }
}
