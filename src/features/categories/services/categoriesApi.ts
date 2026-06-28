import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, Category, InventoryData } from '@/app/_lib/types'

export type CreateCategoryInput = Pick<Category, 'name' | 'parentId' | 'description'>
export type UpdateCategoryInput = Partial<CreateCategoryInput>

export function getCategoriesPageData(token: string): Promise<Pick<InventoryData, 'categories'>> {
  return apiRequest<ApiResponse<Category[]>>('/api/categories', { headers: authHeaders(token) }).then((response) => ({ categories: response.data }))
}

export function createCategory(token: string, input: CreateCategoryInput) {
  return apiRequest<ApiResponse<Category>>('/api/categories', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updateCategory(token: string, categoryId: string, input: UpdateCategoryInput) {
  return apiRequest<ApiResponse<Category>>(`/api/categories/${categoryId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deleteCategory(token: string, categoryId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/categories/${categoryId}`, { method: 'DELETE', headers: authHeaders(token) })
}
