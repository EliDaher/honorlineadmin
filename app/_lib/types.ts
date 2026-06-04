export type Currency = 'USD' | 'SYP'

export type Money = {
  amount: number
  currency: Currency
}

export type User = {
  id: string
  username: string
  role: 'admin' | 'employee' | 'user'
}

export type Category = {
  id: string
  name: string
  parentId: string
  description: string
  productCount?: number
  cableRollCount?: number
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: string
  name: string
  sku: string
  category: string
  categoryId: string
  quantityOnHand: number
  quantityOnHold: number
  costPrice: number
  salePrice: number
  currency: Currency
  notes: string
  createdAt: string
  updatedAt: string
}

export type ContactType = 'dealer' | 'customer' | 'worker' | 'supplier'

export type Contact = {
  id: string
  type: ContactType
  name: string
  phone: string
  address: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type Hold = {
  id: string
  productId: string
  contactId: string
  finalCustomerId?: string
  quantityHeld: number
  quantitySold: number
  quantityReturned: number
  remainingQuantity: number
  unitPrice: number
  currency: Currency
  paidAmount: number
  amountDue: number
  balanceDue: number
  amountDueMoney?: Money
  balanceDueMoney?: Money
  status: 'active' | 'awaiting_payment' | 'settled'
  note: string
  createdAt: string
  updatedAt: string
  settledAt?: string
}

export type Sale = {
  id: string
  productId: string
  cableRollId: string
  cableCutId: string
  responsibleContactId: string
  finalCustomerId: string
  quantity: number
  unitPrice: Money
  total: Money
  paidAmount: Money
  balanceDue: Money
  status: 'unpaid' | 'partial' | 'paid'
  note: string
  createdAt: string
  updatedAt: string
  paidAt?: string
}

export type Payment = {
  id: string
  targetType: 'sale' | 'hold' | 'customer' | 'contact'
  targetId: string
  customerId: string
  contactId: string
  amount: Money
  note: string
  createdAt: string
}

export type CableRoll = {
  id: string
  productId: string
  rollCode: string
  cableType: string
  categoryId: string
  color: string
  originalMeters: number
  remainingMeters: number
  costPerMeter: Money
  salePricePerMeter: Money
  location: string
  lowMeterAlert: number
  notes: string
  createdAt: string
  updatedAt: string
}

export type CableCut = {
  id: string
  cableRollId: string
  productId: string
  destinationType: 'sale' | 'hold' | 'use'
  responsibleContactId: string
  finalCustomerId: string
  meters: number
  pricePerMeter: Money
  total: Money
  saleId: string
  note: string
  createdAt: string
}

export type PartyLedger = {
  activeHolds: Hold[]
  holds: Hold[]
  salesAsResponsible: Sale[]
  salesAsCustomer: Sale[]
  payments: Payment[]
  balancesByCurrency: Record<Currency, number>
  itemsInCustody: number
  soldQuantity: number
  collectedByCurrency: Record<Currency, number>
}

export type WorkerDetail = Contact & {
  detail: PartyLedger
}

export type CustomerDetail = Contact & {
  ledger: PartyLedger
}

export type InventorySummary = {
  totalProducts: number
  totalContacts: number
  totalCategories: number
  totalCableRolls: number
  lowCableRolls: number
  stockOnHand: number
  stockOnHold: number
  activeHolds: number
  unpaidBalance: Record<Currency, number>
}

export type ApiResponse<T> = {
  success: true
  data: T
}

export type ViewKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'contacts'
  | 'workers'
  | 'customers'
  | 'holds'
  | 'sales'
  | 'payments'
  | 'cables'

export type InventoryData = {
  summary: InventorySummary | null
  products: Product[]
  categories: Category[]
  contacts: Contact[]
  workers: WorkerDetail[]
  customers: CustomerDetail[]
  holds: Hold[]
  sales: Sale[]
  payments: Payment[]
  cableRolls: CableRoll[]
  cableCuts: CableCut[]
}
