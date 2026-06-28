'use client'

import { HandCoins, ShoppingCart } from 'lucide-react'
import { Button, EmptyState, Panel, RowActions, inputClass } from '@/app/_components/ui'
import { formatMoney } from '@/app/_lib/format'
import type { Sale } from '@/app/_lib/types'
import type { SalesViewData } from '../types/sales.types'
import { getProductName, getSaleStatusLabel, getUnpaidSales } from '../utils/salesCalculations'

type SalesTableProps = {
  data: SalesViewData
  paymentAmounts: Record<string, string>
  onPaymentAmountChange: (saleId: string, amount: string) => void
  onPayment: (sale: Sale) => void
  onCreateSale: () => void
  onEditSale: (sale: Sale) => void
  onDeleteSale: (sale: Sale) => void
  savingAction: string
}

export function SalesTable({ data, paymentAmounts, onPaymentAmountChange, onPayment, onCreateSale, onEditSale, onDeleteSale, savingAction }: SalesTableProps) {
  const unpaidSales = getUnpaidSales(data.sales)

  return (
    <Panel
      title="المبيعات"
      description="آخر المبيعات وتسجيل دفعات سريع."
      actions={<Button type="button" icon={ShoppingCart} onClick={onCreateSale}>بيع مباشر</Button>}
    >
      {data.sales.length === 0 ? (
        <EmptyState title="لا توجد مبيعات بعد." icon={ShoppingCart} />
      ) : (
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {data.sales.map((sale) => (
            <div key={sale.id} className="grid gap-2 px-3 py-3 text-sm sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-center">
              <span className="min-w-0 truncate font-semibold text-slate-950">{getProductName(sale.productId, data.products)}</span>
              <span className="min-w-0 truncate text-slate-600">{formatMoney(sale.total)} / المستحق {formatMoney(sale.balanceDue)}</span>
              <span className="min-w-0 truncate text-slate-600">{getSaleStatusLabel(sale.status)}</span>
              <RowActions onEdit={() => onEditSale(sale)} onDelete={() => onDeleteSale(sale)} editLoading={savingAction === `sale-${sale.id}`} deleteLoading={savingAction === `delete-sale-${sale.id}`} />
            </div>
          ))}
        </div>
      )}

      {unpaidSales.length > 0 ? (
        <div className="mt-4 space-y-2">
          {unpaidSales.map((sale) => (
            <div key={sale.id} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_180px_120px]">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{getProductName(sale.productId, data.products)}</p>
                <p className="text-xs text-slate-500">المستحق {formatMoney(sale.balanceDue)}</p>
              </div>
              <input type="number" min="0" step="0.01" value={paymentAmounts[sale.id] || ''} onChange={(event) => onPaymentAmountChange(sale.id, event.target.value)} className={inputClass()} />
              <Button type="button" variant="secondary" icon={HandCoins} loading={savingAction === `sale-pay-${sale.id}`} onClick={() => onPayment(sale)}>دفع</Button>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  )
}
