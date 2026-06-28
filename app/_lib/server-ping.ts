import type { ServerPingSummary } from './types'

export const dashboardPingTarget = '8.8.8.8'
export const dashboardPingCount = 4
export const dashboardPingIntervalMs = 30000

export const pingStatusLabels: Record<ServerPingSummary['status'], string> = {
  online: 'متصل',
  degraded: 'بطيء',
  offline: 'غير متصل',
  auth_error: 'خطأ دخول',
  error: 'خطأ'
}

export const pingStatusTones: Record<ServerPingSummary['status'], 'success' | 'warning' | 'danger' | 'neutral' | 'blue'> = {
  online: 'success',
  degraded: 'warning',
  offline: 'danger',
  auth_error: 'danger',
  error: 'neutral'
}

export function formatPingNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits
  }).format(value)
}

export function formatPingAverage(value: number | null | undefined) {
  return typeof value === 'number' ? `${formatPingNumber(value)} ms` : '--'
}
