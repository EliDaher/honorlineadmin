import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, CableCut, CableRoll, Category, Contact, Currency, InventoryData, Product } from '@/app/_lib/types'

export type CreateCableRollInput = { productId: string; rollCode: string; cableType: string; categoryId: string; color: string; originalMeters: number; costPerMeter: number; salePricePerMeter: number; currency: Currency; location: string; lowMeterAlert: number; notes: string }
export type CutCableInput = { meters: number; pricePerMeter: number; destinationType: CableCut['destinationType']; responsibleContactId: string; finalCustomerId: string; currency: Currency }
export type UpdateCableRollInput = Partial<Omit<CreateCableRollInput, 'productId' | 'originalMeters'>>

export async function getCablesPageData(token: string): Promise<Pick<InventoryData, 'cableRolls' | 'cableCuts' | 'products' | 'contacts' | 'categories'>> {
  const headers = authHeaders(token)
  const [cableRolls, cableCuts, products, contacts, categories] = await Promise.all([
    apiRequest<ApiResponse<CableRoll[]>>('/api/cables/rolls', { headers }),
    apiRequest<ApiResponse<CableCut[]>>('/api/cables/cuts', { headers }),
    apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
    apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers }),
    apiRequest<ApiResponse<Category[]>>('/api/categories', { headers })
  ])
  return { cableRolls: cableRolls.data, cableCuts: cableCuts.data, products: products.data, contacts: contacts.data, categories: categories.data }
}

export function createCableRoll(token: string, input: CreateCableRollInput) {
  return apiRequest<ApiResponse<CableRoll>>('/api/cables/rolls', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updateCableRoll(token: string, rollId: string, input: UpdateCableRollInput) {
  return apiRequest<ApiResponse<CableRoll>>(`/api/cables/rolls/${rollId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deleteCableRoll(token: string, rollId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/cables/rolls/${rollId}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function cutCableRoll(token: string, rollId: string, input: CutCableInput) {
  return apiRequest<ApiResponse<CableCut>>(`/api/cables/rolls/${rollId}/cut`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}
