import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, Category, Currency, InventoryData, Product } from '@/app/_lib/types'

export type CreateProductInput = Pick<Product, 'name' | 'sku' | 'category' | 'categoryId' | 'quantityOnHand' | 'costPrice' | 'salePrice' | 'currency' | 'notes'>
export type UpdateProductInput = Partial<Pick<Product, 'name' | 'sku' | 'category' | 'categoryId' | 'costPrice' | 'salePrice' | 'currency' | 'notes'>>

export async function getProductsPageData(token: string): Promise<Pick<InventoryData, 'products' | 'categories'>> {
  const headers = authHeaders(token)
  const [products, categories] = await Promise.all([
    apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
    apiRequest<ApiResponse<Category[]>>('/api/categories', { headers })
  ])
  return { products: products.data, categories: categories.data }
}

export function createProduct(token: string, input: CreateProductInput) {
  return apiRequest<ApiResponse<Product>>('/api/products', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updateProduct(token: string, productId: string, input: UpdateProductInput) {
  return apiRequest<ApiResponse<Product>>(`/api/products/${productId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deleteProduct(token: string, productId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/products/${productId}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function addProductStock(token: string, productId: string, quantity: number) {
  return apiRequest<ApiResponse<Product>>(`/api/products/${productId}/stock`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ quantity }) })
}
