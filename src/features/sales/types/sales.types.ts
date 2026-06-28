import type { Contact, Currency, InventoryData, Product, Sale } from '@/app/_lib/types'

export type SalesPageData = Pick<InventoryData, 'contacts' | 'products' | 'sales'>

export type SaleFormValues = {
  productId: string
  responsibleContactId: string
  finalCustomerId: string
  quantity: string
  unitPrice: string
  currency: Currency
  note: string
}

export type CreateSaleInput = Omit<SaleFormValues, 'quantity' | 'unitPrice'> & {
  quantity: number
  unitPrice: number
}

export type RecordSalePaymentInput = {
  amount: number
  currency: Currency
}

export type SalesViewData = {
  contacts: Contact[]
  products: Product[]
  sales: Sale[]
}
