import type { ApiResponse, User } from './types'

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000'
  // "https://honorbackend.onrender.com"
).replace(/\/$/, "");
export const TOKEN_STORAGE_KEY = 'honorline_admin_token'

type ApiErrorBody = {
  success?: false
  message?: string
  code?: string
}

const apiErrorMessages: Record<string, string> = {
  INSUFFICIENT_STOCK: 'الكمية المتوفرة في المخزون غير كافية.',
  INVALID_HOLD_QUANTITY: 'الكمية أكبر من الكمية المتبقية في الأمانة.',
  PAYMENT_EXCEEDS_BALANCE: 'المبلغ أكبر من الرصيد المستحق.',
  CURRENCY_MISMATCH: 'عملة الدفعة يجب أن تطابق عملة العملية.',
  HOLD_HAS_ACTIVITY: 'لا يمكن تنفيذ هذا الإجراء لأن الأمانة لديها حركة بيع أو دفع أو إرجاع.',
  HOLD_RECEIPT_HAS_ACTIVITY: 'لا يمكن حذف وصل الأمانة لأن أحد بنوده لديه حركة بيع أو دفع أو إرجاع.',
  HOLD_RECEIPT_NOT_FOUND: 'وصل الأمانة غير موجود.',
  HOLD_NOT_FOUND: 'الأمانة غير موجودة.',
  PRODUCT_NOT_FOUND: 'المنتج غير موجود.',
  CONTACT_NOT_FOUND: 'الجهة غير موجودة.',
  CUSTOMER_NOT_FOUND: 'الزبون غير موجود.'
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const hasBody =
    options.body !== undefined &&
    options.body !== null &&
    options.body !== ""

  if (hasBody) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
  } else {
    headers.delete("Content-Type")
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody

  if (!response.ok) {
    throw new Error((body.code && apiErrorMessages[body.code]) || body.message || `Request failed with status ${response.status}`)
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
