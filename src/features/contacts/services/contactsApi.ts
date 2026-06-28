import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, Contact, InventoryData } from '@/app/_lib/types'

export type CreateContactInput = Pick<Contact, 'type' | 'name' | 'phone' | 'address' | 'notes'>
export type UpdateContactInput = Partial<CreateContactInput>

export function getContactsPageData(token: string): Promise<Pick<InventoryData, 'contacts'>> {
  return apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers: authHeaders(token) }).then((response) => ({ contacts: response.data }))
}

export function createContact(token: string, input: CreateContactInput) {
  return apiRequest<ApiResponse<Contact>>('/api/contacts', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updateContact(token: string, contactId: string, input: UpdateContactInput) {
  return apiRequest<ApiResponse<Contact>>(`/api/contacts/${contactId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deleteContact(token: string, contactId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/contacts/${contactId}`, { method: 'DELETE', headers: authHeaders(token) })
}
