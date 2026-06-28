import { apiRequest, authHeaders } from '@/app/_lib/api'
import type { AccountingAccount, AccountingDashboard, AccountingExpense, AccountingPurchase, ApiResponse, Contact, Currency, FinancialStatements, InventoryData, JournalEntry, Product } from '@/app/_lib/types'

export type CreateExpenseInput = { category: string; vendorContactId: string; amount: number; currency: Currency; paidStatus: 'paid' | 'unpaid'; note: string }
export type CreatePurchaseInput = { productId: string; supplierContactId: string; quantity: number; unitCost: number; currency: Currency; paidStatus: 'paid' | 'unpaid'; note: string }
export type UpdateExpenseInput = Partial<CreateExpenseInput>
export type UpdatePurchaseInput = Partial<Omit<CreatePurchaseInput, 'productId'>>

export async function getAccountingPageData(token: string): Promise<Pick<InventoryData, 'accountingDashboard' | 'financialStatements' | 'journalEntries' | 'accounts' | 'contacts' | 'products' | 'expenses' | 'purchases'>> {
  const headers = authHeaders(token)
  const [accountingDashboard, financialStatements, journalEntries, accounts, contacts, products, expenses, purchases] = await Promise.all([
    apiRequest<ApiResponse<AccountingDashboard>>('/api/accounting/dashboard', { headers }),
    apiRequest<ApiResponse<FinancialStatements>>('/api/accounting/statements', { headers }),
    apiRequest<ApiResponse<JournalEntry[]>>('/api/accounting/transactions', { headers }),
    apiRequest<ApiResponse<AccountingAccount[]>>('/api/accounting/accounts', { headers }),
    apiRequest<ApiResponse<Contact[]>>('/api/contacts', { headers }),
    apiRequest<ApiResponse<Product[]>>('/api/products', { headers }),
    apiRequest<ApiResponse<AccountingExpense[]>>('/api/accounting/expenses', { headers }),
    apiRequest<ApiResponse<AccountingPurchase[]>>('/api/accounting/purchases', { headers })
  ])
  return { accountingDashboard: accountingDashboard.data, financialStatements: financialStatements.data, journalEntries: journalEntries.data, accounts: accounts.data, contacts: contacts.data, products: products.data, expenses: expenses.data, purchases: purchases.data }
}

export function createExpense(token: string, input: CreateExpenseInput) {
  return apiRequest<ApiResponse<AccountingExpense>>('/api/accounting/expenses', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updateExpense(token: string, expenseId: string, input: UpdateExpenseInput) {
  return apiRequest<ApiResponse<AccountingExpense>>(`/api/accounting/expenses/${expenseId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deleteExpense(token: string, expenseId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/accounting/expenses/${expenseId}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function createPurchase(token: string, input: CreatePurchaseInput) {
  return apiRequest<ApiResponse<AccountingPurchase>>('/api/accounting/purchases', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function updatePurchase(token: string, purchaseId: string, input: UpdatePurchaseInput) {
  return apiRequest<ApiResponse<AccountingPurchase>>(`/api/accounting/purchases/${purchaseId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(input) })
}

export function deletePurchase(token: string, purchaseId: string) {
  return apiRequest<ApiResponse<{ id: string }>>(`/api/accounting/purchases/${purchaseId}`, { method: 'DELETE', headers: authHeaders(token) })
}

export function backfillAccountingEntries(token: string) {
  return apiRequest<ApiResponse<unknown>>('/api/accounting/backfill', { method: 'POST', headers: authHeaders(token) })
}
