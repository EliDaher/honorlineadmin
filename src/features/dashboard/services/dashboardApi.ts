import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, CableRoll, InventoryData, InventorySummary, ManagedServer, Product, Sale } from '@/app/_lib/types'

export async function getDashboardPageData(token: string): Promise<Pick<InventoryData, 'summary' | 'products' | 'sales' | 'cableRolls' | 'servers'>> {
  const headers = authHeaders(token)
  const [summary, products, sales, cableRolls, servers] = await Promise.all([
    apiRequest<ApiResponse<InventorySummary>>('/api/inventory/summary', { headers }),
    apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
    apiRequest<ApiResponse<Sale[]>>('/api/sales', { headers }),
    apiRequest<ApiResponse<CableRoll[]>>('/api/cables/rolls', { headers }),
    apiRequest<ApiResponse<ManagedServer[]>>('/api/servers', { headers })
  ])
  return { summary: summary.data, products: products.data, sales: sales.data, cableRolls: cableRolls.data, servers: servers.data }
}
