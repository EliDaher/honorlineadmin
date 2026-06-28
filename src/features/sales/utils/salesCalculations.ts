import type { Contact, Product, Sale } from '@/app/_lib/types'

export function getCustomers(contacts: Contact[]) {
  return contacts.filter((contact) => contact.type === 'customer')
}

export function getProductName(productId: string, products: Product[]) {
  return products.find((product) => product.id === productId)?.name || 'منتج غير معروف'
}

export function getUnpaidSales(sales: Sale[]) {
  return sales.filter((sale) => sale.status !== 'paid')
}

export function getSaleStatusLabel(status: Sale['status']) {
  const labels: Record<Sale['status'], string> = {
    unpaid: 'غير مدفوع',
    partial: 'مدفوع جزئيا',
    paid: 'مدفوع'
  }

  return labels[status]
}
