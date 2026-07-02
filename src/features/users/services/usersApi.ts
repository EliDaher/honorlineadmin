import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { ApiResponse, AppUser } from '@/app/_lib/types'

export type CreateUserInput = {
  username: string
  password: string
  role: 'admin' | 'worker'
  contactId?: string
  isActive?: boolean
}

export type UpdateUserInput = Partial<CreateUserInput>

export function getUsers(token: string) {
  return apiRequest<ApiResponse<AppUser[]>>('/api/users', { headers: authHeaders(token) })
}

export function createUser(token: string, input: CreateUserInput) {
  return apiRequest<ApiResponse<AppUser>>('/api/users', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updateUser(token: string, userId: string, input: UpdateUserInput) {
  return apiRequest<ApiResponse<AppUser>>(`/api/users/${userId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}
