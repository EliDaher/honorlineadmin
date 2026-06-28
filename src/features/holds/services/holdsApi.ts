import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, Contact, Currency, Hold, HoldReceipt, InventoryData, Payment, Product } from '@/app/_lib/types'

export type CreateHoldInput = { productId: string; contactId: string; finalCustomerId: string; quantity: number; unitPrice: number; currency: Currency; note: string }
export type UpdateHoldInput = Partial<Pick<CreateHoldInput, 'contactId' | 'finalCustomerId' | 'unitPrice' | 'currency' | 'note'>>
export type CreateHoldReceiptInput = {
  contactId: string
  finalCustomerId: string
  note: string
  items: Array<Pick<CreateHoldInput, 'productId' | 'quantity' | 'unitPrice' | 'currency' | 'note'>>
}

export async function getHoldsPageData(token: string): Promise<Pick<InventoryData, 'holds' | 'holdReceipts' | 'products' | 'contacts'>> {
  const headers = authHeaders(token)
  const [holds, holdReceipts, products, contacts] = await Promise.all([
    apiRequest<ApiResponse<Hold[]>>('/api/holds', { headers }),
    apiRequest<ApiResponse<HoldReceipt[]>>('/api/hold-receipts', { headers }),
    apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
    apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers })
  ])
  return { holds: holds.data, holdReceipts: holdReceipts.data, products: products.data, contacts: contacts.data }
}

export function createHold(token: string, input: CreateHoldInput) {
  return apiRequest<ApiResponse<Hold>>('/api/holds', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function createHoldReceipt(token: string, input: CreateHoldReceiptInput) {
  return apiRequest<ApiResponse<HoldReceipt>>('/api/hold-receipts', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deleteHoldReceipt(token: string, receiptId: string) {
  return apiRequest<ApiResponse<{ id: string; itemIds: string[] }>>(`/api/hold-receipts/${receiptId}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function updateHold(token: string, holdId: string, input: UpdateHoldInput) {
  return apiRequest<ApiResponse<Hold>>(`/api/holds/${holdId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deleteHold(token: string, holdId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/holds/${holdId}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function sellHold(token: string, holdId: string, quantity: number, finalCustomerId: string, note = '') {
  return apiRequest<ApiResponse<Hold>>(`/api/holds/${holdId}/sell`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ quantity, finalCustomerId, note }) })
}

export function recordHoldPayment(token: string, holdId: string, amount: number, currency: Currency, note = '') {
  return apiRequest<ApiResponse<{ hold: Hold; payment: Payment }>>(`/api/holds/${holdId}/payment`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ amount, currency, note }) })
}

export function returnHold(token: string, holdId: string, quantity: number, note = '') {
  return apiRequest<ApiResponse<Hold>>(`/api/holds/${holdId}/return`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ quantity, note }) })
}
