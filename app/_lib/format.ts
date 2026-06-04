import type { Currency, Money } from './types'

export function formatMoney(value: Money | number | undefined, currency: Currency = 'USD') {
  const amount = typeof value === 'number' ? value : value?.amount ?? 0
  const selectedCurrency = typeof value === 'number' ? currency : value?.currency ?? currency

  if (selectedCurrency === 'SYP') {
    return `${new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(amount)} SYP`
  }

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: selectedCurrency,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatBalances(balances?: Record<Currency, number>) {
  if (!balances) return 'USD $0.00 / SYP 0'
  return `${formatMoney(balances.USD, 'USD')} / ${formatMoney(balances.SYP, 'SYP')}`
}

export function dateShort(value?: string) {
  if (!value) return 'Unavailable'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
