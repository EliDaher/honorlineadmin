import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, Sale } from '@/app/_lib/types'
import type { CreateSaleInput, RecordSalePaymentInput, SalesPageData } from '../types/sales.types'

export async function getSalesPageData(token: string): Promise<SalesPageData> {
  const headers = authHeaders(token)
  const [products, contacts, sales] = await Promise.all([
    apiRequest<ApiResponse<SalesPageData['products']>>('/api/products', { headers }),
    apiRequest<ApiResponse<SalesPageData['contacts']>>('/api/contacts', { headers }),
    apiRequest<ApiResponse<SalesPageData['sales']>>('/api/sales', { headers })
  ])

  return {
    products: products.data,
    contacts: contacts.data,
    sales: sales.data
  }
}

export function createSale(token: string, input: CreateSaleInput) {
  return apiRequest<ApiResponse<Sale>>('/api/sales', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input)
  })
}

export function updateSale(token: string, saleId: string, input: Partial<Pick<CreateSaleInput, 'responsibleContactId' | 'finalCustomerId' | 'note'>>) {
  return apiRequest<ApiResponse<Sale>>(`/api/sales/${saleId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input)
  })
}

export function deleteSale(token: string, saleId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/sales/${saleId}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  })
}

export function recordSalePayment(token: string, saleId: string, input: RecordSalePaymentInput) {
  return apiRequest<ApiResponse<Sale>>(`/api/sales/${saleId}/payment`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input)
  })
}
