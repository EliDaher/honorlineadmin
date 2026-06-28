import type { InventoryData, InventorySummary } from './types'

export const emptyData: InventoryData = {
  summary: null,
  products: [],
  categories: [],
  contacts: [],
  workers: [],
  customers: [],
  holds: [],
  sales: [],
  payments: [],
  accountingDashboard: null,
  financialStatements: null,
  journalEntries: [],
  accounts: [],
  expenses: [],
  purchases: [],
  cableRolls: [],
  cableCuts: [],
  servers: []
}

export const emptySummary: InventorySummary = {
  totalProducts: 0,
  totalContacts: 0,
  totalCategories: 0,
  totalCableRolls: 0,
  lowCableRolls: 0,
  stockOnHand: 0,
  stockOnHold: 0,
  activeHolds: 0,
  unpaidBalance: { USD: 0, SYP: 0 }
}
