import type { ApiResponse, User } from './types'

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  // || 'http://localhost:5000'
  "https://honorbackend.onrender.com"
).replace(/\/$/, "");
export const TOKEN_STORAGE_KEY = 'honorline_admin_token'

type ApiErrorBody = {
  success?: false
  message?: string
  code?: string
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody

  if (!response.ok) {
    throw new Error(body.message || `Request failed with status ${response.status}`)
  }

  return body as T
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function login(username: string, password: string) {
  return apiRequest<ApiResponse<{ token: string; user: User }>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}
