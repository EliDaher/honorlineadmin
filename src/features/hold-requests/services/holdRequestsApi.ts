import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, Contact, Currency, HoldRequest, HoldRequestItem, HoldReceipt, InventoryData, Product } from '@/app/_lib/types'

export type CreateHoldRequestInput = {
  workerContactId?: string
  note: string
  items: Array<{
    productId: string
    quantity: number
    note: string
  }>
}

export type ApproveHoldRequestInput = {
  adminNote: string
  items: HoldRequestItem[]
}

export type EditableHoldRequestItem = {
  productId: string
  quantity: string
  unitPrice: string
  currency: Currency
  note: string
}

export async function getHoldRequestsPageData(token: string): Promise<Pick<InventoryData, 'holdRequests' | 'products' | 'contacts'>> {
  const headers = authHeaders(token)
  const [holdRequests, products, contacts] = await Promise.all([
    apiRequest<ApiResponse<HoldRequest[]>>('/api/hold-requests', { headers }),
    apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
    apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers })
  ])
  return { holdRequests: holdRequests.data, products: products.data, contacts: contacts.data }
}

export function createHoldRequest(token: string, input: CreateHoldRequestInput) {
  return apiRequest<ApiResponse<HoldRequest>>('/api/hold-requests', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function approveHoldRequest(token: string, requestId: string, input: ApproveHoldRequestInput) {
  return apiRequest<ApiResponse<{ request: HoldRequest; receipt: HoldReceipt }>>(`/api/hold-requests/${requestId}/approve`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input)
  })
}

export function rejectHoldRequest(token: string, requestId: string, adminNote: string) {
  return apiRequest<ApiResponse<HoldRequest>>(`/api/hold-requests/${requestId}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ adminNote })
  })
}

export function cancelHoldRequest(token: string, requestId: string) {
  return apiRequest<ApiResponse<HoldRequest>>(`/api/hold-requests/${requestId}/cancel`, {
    method: 'POST',
    headers: authHeaders(token)
  })
}
