import type { Currency, Money } from './types'

export function formatMoney(value: Money | number | undefined, currency: Currency = 'USD') {
  const amount = typeof value === 'number' ? value : value?.amount ?? 0
  const selectedCurrency = typeof value === 'number' ? currency : value?.currency ?? currency

  if (selectedCurrency === 'SYP') {
    return `${new Intl.NumberFormat('ar-SY', { maximumFractionDigits: 0 }).format(amount)} ل.س`
  }

  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency: selectedCurrency,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatBalances(balances?: Record<Currency, number>) {
  if (!balances) return 'USD ٠٫٠٠ / SYP ٠'
  return `${formatMoney(balances.USD, 'USD')} / ${formatMoney(balances.SYP, 'SYP')}`
}

export function dateShort(value?: string) {
  if (!value) return 'غير متوفر'
  return new Intl.DateTimeFormat('ar-SY', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
