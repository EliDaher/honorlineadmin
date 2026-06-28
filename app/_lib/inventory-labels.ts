import type { Category, Contact, ContactType, Product } from './types'

export const contactTypeLabels: Record<ContactType, string> = {
  dealer: 'تاجر',
  customer: 'زبون',
  worker: 'عامل',
  supplier: 'مورد'
}

export const statusLabels: Record<string, string> = {
  active: 'نشط',
  awaiting_payment: 'بانتظار الدفع',
  settled: 'مسدد',
  unpaid: 'غير مدفوع',
  partial: 'مدفوع جزئيا',
  paid: 'مدفوع',
  sale: 'بيع',
  hold: 'أمانة',
  customer: 'زبون',
  contact: 'جهة',
  use: 'استخدام داخلي',
  expense: 'مصروف',
  purchase: 'شراء',
  product: 'منتج',
  payment: 'دفعة',
  cable_sale: 'بيع كابل',
  cable_roll: 'رول كابل',
  balanced: 'متوازن',
  unbalanced: 'غير متوازن'
}

export const accountNameLabels: Record<string, string> = {
  Cash: 'النقدية',
  'Accounts Receivable': 'الذمم المدينة',
  Inventory: 'المخزون',
  'Accounts Payable': 'الذمم الدائنة',
  'Opening Balance Equity': 'حقوق الملكية الافتتاحية',
  'Sales Revenue': 'إيرادات المبيعات',
  'Cost of Goods Sold': 'تكلفة البضاعة المباعة',
  'Operating Expenses': 'المصاريف التشغيلية'
}

export const memoLabels: Record<string, string> = {
  'Sale recorded': 'تم تسجيل بيع',
  'Payment received': 'تم استلام دفعة',
  'Initial product inventory value': 'قيمة مخزون افتتاحية للمنتج',
  'Direct product sale': 'بيع مباشر',
  'Hold sale settled': 'تسوية بيع أمانة',
  'Hold payment': 'دفعة أمانة',
  'Sale payment': 'دفعة بيع',
  'Direct payment': 'دفعة مباشرة',
  'Cable sale': 'بيع كابل',
  'Opening cable roll value': 'قيمة افتتاحية لرول كابل',
  'Stock purchase': 'شراء مخزون'
}

export function categoryLabel(category: Category, categories: Category[]) {
  const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : null
  return parent ? `${parent.name} / ${category.name}` : category.name
}

export function contactName(id: string, contacts: Contact[]) {
  return contacts.find((contact) => contact.id === id)?.name || 'غير محدد'
}

export function productName(id: string, products: Product[]) {
  return products.find((product) => product.id === id)?.name || 'منتج غير معروف'
}

export function labelStatus(value?: string) {
  return value ? statusLabels[value] || value : ''
}

export function labelContactType(value: ContactType) {
  return contactTypeLabels[value] || value
}

export function labelAccountName(name: string) {
  return accountNameLabels[name] || name
}

export function labelMemo(memo: string) {
  return memoLabels[memo] || memo
}
