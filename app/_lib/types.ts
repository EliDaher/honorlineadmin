export type Currency = 'USD' | 'SYP'

export type Money = {
  amount: number
  currency: Currency
}

export type User = {
  id: string
  username: string
  role: 'admin' | 'worker' | 'employee' | 'user'
  contactId?: string
  isActive?: boolean
  hasPassword?: boolean
  createdAt?: string
  updatedAt?: string
}

export type AppUser = {
  id: string
  username: string
  role: 'admin' | 'worker'
  contactId?: string
  isActive: boolean
  hasPassword: boolean
  createdAt: string
  updatedAt: string
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
  receiptId?: string
  productId: string
  contactId: string
  finalCustomerId?: string
  quantityHeld: number
  quantitySold: number
  quantityReturned: number
  remainingQuantity: number
  unitPrice: number
  currency: Currency
  grossAmount?: number
  discountAmount: number
  paidAmount: number
  amountDue: number
  balanceDue: number
  grossAmountMoney?: Money
  discountAmountMoney?: Money
  amountDueMoney?: Money
  balanceDueMoney?: Money
  status: 'active' | 'awaiting_payment' | 'settled'
  note: string
  createdAt: string
  updatedAt: string
  settledAt?: string
}

export type HoldReceipt = {
  id: string
  receiptNumber: string
  contactId: string
  finalCustomerId?: string
  itemIds: string[]
  items: Hold[]
  itemCount: number
  remainingQuantity: number
  balancesDue: Record<Currency, number>
  status: 'active' | 'awaiting_payment' | 'settled'
  note: string
  createdAt: string
  updatedAt: string
}

export type HoldRequestItem = {
  productId: string
  quantity: number
  unitPrice: number
  currency: Currency
  note: string
}

export type HoldRequest = {
  id: string
  workerContactId: string
  requestedByUserId: string
  requestedByUsername: string
  items: HoldRequestItem[]
  status: 'pending' | 'approved' | 'rejected' | 'canceled'
  note: string
  adminNote: string
  holdReceiptId?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  canceledAt?: string
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
  date?: string
  createdAt: string
}

export type CustomerDebtInvoice = {
  id: string
  customerId: string
  amount: Money
  note: string
  date: string
  createdAt: string
}

export type CustomerStatementEntry = {
  id: string
  sourceType: 'debt_invoice' | 'sale' | 'hold' | 'payment'
  sourceId: string
  date: string
  description: string
  currency: Currency
  debit?: Money
  credit?: Money
  runningBalanceByCurrency: Record<Currency, number>
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export type AccountingAccount = {
  id: string
  code: string
  name: string
  type: AccountType
  description: string
  system: boolean
  createdAt: string
  updatedAt: string
}

export type CurrencyBalance = Record<Currency, number>

export type JournalLine = {
  accountId: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  currency: Currency
  partyId: string
  description: string
}

export type JournalEntry = {
  id: string
  date: string
  sourceType: string
  sourceId: string
  sourceAction: string
  memo: string
  partyId: string
  balanced: boolean
  lines: JournalLine[]
  createdAt: string
}

export type AccountingDashboard = {
  generatedAt: string
  metrics: {
    cash: CurrencyBalance
    receivables: CurrencyBalance
    inventory: CurrencyBalance
    payables: CurrencyBalance
    revenue: CurrencyBalance
    cogs: CurrencyBalance
    grossProfit: CurrencyBalance
    expenses: CurrencyBalance
    netProfit: CurrencyBalance
  }
  counts: {
    journalEntries: number
    unbalancedEntries: number
    expenses: number
    purchases: number
  }
  recentEntries: JournalEntry[]
}

export type AccountBalance = {
  account: AccountingAccount
  raw: CurrencyBalance
  balance: CurrencyBalance
}

export type FinancialStatements = {
  generatedAt: string
  profitAndLoss: {
    revenue: CurrencyBalance
    cogs: CurrencyBalance
    grossProfit: CurrencyBalance
    operatingExpenses: CurrencyBalance
    netProfit: CurrencyBalance
  }
  balanceSheet: {
    assets: AccountBalance[]
    liabilities: AccountBalance[]
    equity: AccountBalance[]
    currentEarnings: CurrencyBalance
    totals: {
      assets: CurrencyBalance
      liabilities: CurrencyBalance
      equity: CurrencyBalance
      liabilitiesAndEquity: CurrencyBalance
    }
  }
  accountBalances: AccountBalance[]
}

export type AccountingExpense = {
  id: string
  category: string
  vendorContactId: string
  amount: Money
  paidStatus: 'paid' | 'unpaid'
  note: string
  createdAt: string
}

export type AccountingPurchase = {
  id: string
  productId: string
  supplierContactId: string
  quantity: number
  unitCost: Money
  total: Money
  paidStatus: 'paid' | 'unpaid'
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

export type ManagedServer = {
  id: string
  name: string
  apiBaseUrl: string
  username: string
  notes: string
  hasPassword: boolean
  createdAt: string
  updatedAt: string
}

export type ServerPingSummary = {
  address: string
  count: number
  avgMs: number | null
  received: number
  transmitted: number
  lossPercent: number
  status: 'online' | 'degraded' | 'offline' | 'auth_error' | 'error'
}

export type ServerApiResult = {
  fetchedAt: string
  result: unknown
  summary?: ServerPingSummary
  error?: {
    code: string
    message: string
  }
}

export type ServerNeighbor = {
  '.id': string
  address?: string
  address4?: string
  address6?: string
  age?: string
  board?: string
  'discovered-by'?: string
  identity?: string
  interface?: string
  'interface-name'?: string
  ipv6?: string
  'mac-address'?: string
  platform?: string
  'software-id'?: string
  'system-caps'?: string
  'system-caps-enabled'?: string
  'system-description'?: string
  unpack?: string
  uptime?: string
  version?: string
  [key: string]: string | undefined
}

export type ServerNeighborsResult = {
  fetchedAt: string
  result: ServerNeighbor[]
}

export type PartyLedger = {
  activeHolds: Hold[]
  holds: Hold[]
  salesAsResponsible: Sale[]
  salesAsCustomer: Sale[]
  payments: Payment[]
  debtInvoices: CustomerDebtInvoice[]
  statement: CustomerStatementEntry[]
  balancesByCurrency: Record<Currency, number>
  custodyValueByCurrency: Record<Currency, number>
  itemsInCustody: number
  soldQuantity: number
  collectedByCurrency: Record<Currency, number>
}

export type WorkerDetail = Contact & {
  detail: PartyLedger
}

export type WorkerProduct = Pick<Product, 'id' | 'name' | 'sku' | 'category' | 'categoryId' | 'quantityOnHand' | 'salePrice' | 'currency' | 'notes' | 'createdAt' | 'updatedAt'>

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
  | 'holdRequests'
  | 'holds'
  | 'myCustody'
  | 'sales'
  | 'payments'
  | 'accounting'
  | 'cables'
  | 'servers'

export type InventoryData = {
  summary: InventorySummary | null
  products: Product[]
  categories: Category[]
  contacts: Contact[]
  users: AppUser[]
  workers: WorkerDetail[]
  currentWorker: WorkerDetail | null
  workerProducts: WorkerProduct[]
  customers: CustomerDetail[]
  holdRequests: HoldRequest[]
  holds: Hold[]
  holdReceipts: HoldReceipt[]
  sales: Sale[]
  payments: Payment[]
  accountingDashboard: AccountingDashboard | null
  financialStatements: FinancialStatements | null
  journalEntries: JournalEntry[]
  accounts: AccountingAccount[]
  expenses: AccountingExpense[]
  purchases: AccountingPurchase[]
  cableRolls: CableRoll[]
  cableCuts: CableCut[]
  servers: ManagedServer[]
}
