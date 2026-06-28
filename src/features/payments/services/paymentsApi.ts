import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, Contact, Currency, CustomerDetail, Hold, InventoryData, Payment, Product, Sale } from '@/app/_lib/types'

export type CreatePaymentInput = { targetType: Payment['targetType']; targetId: string; amount: number; currency: Currency; customerId: string; contactId: string; note: string }
export type UpdatePaymentInput = Partial<Pick<CreatePaymentInput, 'amount' | 'currency' | 'note'>>

export async function getPaymentsPageData(token: string): Promise<Pick<InventoryData, 'payments' | 'customers' | 'contacts' | 'sales' | 'holds' | 'products'>> {
  const headers = authHeaders(token)
  const [payments, customers, contacts, sales, holds, products] = await Promise.all([
    apiRequest<ApiResponse<Payment[]>>('/api/payments', { headers }),
    apiRequest<ApiResponse<CustomerDetail[]>>('/api/customers', { headers }),
    apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers }),
    apiRequest<ApiResponse<Sale[]>>('/api/sales', { headers }),
    apiRequest<ApiResponse<Hold[]>>('/api/holds', { headers }),
    apiRequest<ApiResponse<Product[]>>('/api/products', { headers })
  ])
  return { payments: payments.data, customers: customers.data, contacts: contacts.data, sales: sales.data, holds: holds.data, products: products.data }
}

export function createPayment(token: string, input: CreatePaymentInput) {
  return apiRequest<ApiResponse<Payment>>('/api/payments', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updatePayment(token: string, paymentId: string, input: UpdatePaymentInput) {
  return apiRequest<ApiResponse<Payment>>(`/api/payments/${paymentId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deletePayment(token: string, paymentId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/payments/${paymentId}`, { method: 'DELETE', headers: authHeaders(token) })
}
