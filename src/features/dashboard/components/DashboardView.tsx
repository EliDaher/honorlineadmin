import { AlertTriangle, Boxes, Cable, ShoppingCart, Warehouse, WalletCards } from 'lucide-react'
import type { InventoryAppViewProps } from '@/features/app-shell/types'
import { Metric, Panel } from '@/app/_components/ui'
import { formatBalances, formatMoney } from '@/app/_lib/format'
import { productName, labelStatus } from '@/features/shared/constants/labels'
import { emptySummary } from '@/features/shared/constants/inventory'
import { SimpleRows } from '@/features/shared/components/SimpleRows'

export function DashboardView({ data }: InventoryAppViewProps) {
  const summary = data.summary || emptySummary
  const lowRolls = data.cableRolls.filter((roll) => roll.remainingMeters <= roll.lowMeterAlert)
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Boxes} label="المنتجات" value={String(summary.totalProducts)} detail={`${summary.totalCategories} تصنيف`} />
      <Metric icon={Warehouse} label="المتوفر بالمخزون" value={String(summary.stockOnHand)} detail={`${summary.stockOnHold} في الأمانات`} tone="slate" />
      <Metric icon={Cable} label="رولات الكابل" value={String(summary.totalCableRolls)} detail={`${summary.lowCableRolls} رولات منخفضة`} tone={summary.lowCableRolls > 0 ? 'amber' : 'emerald'} />
      <Metric icon={WalletCards} label="غير مدفوع" value={formatBalances(summary.unpaidBalance)} detail={`${summary.activeHolds} أمانات نشطة`} tone="blue" />
    </section>
    <section className="grid gap-5 xl:grid-cols-2">
      <Panel title="آخر المبيعات" description="أحدث العمليات مع عرض الرصيد المفتوح."><SimpleRows icon={ShoppingCart} rows={data.sales.slice(0, 6).map((sale) => [productName(sale.productId, data.products), formatMoney(sale.balanceDue), labelStatus(sale.status)])} empty="لا توجد مبيعات بعد." /></Panel>
      <Panel title="رولات كابل منخفضة" description="الرولات التي وصلت إلى حد التنبيه أو أقل."><SimpleRows icon={AlertTriangle} rows={lowRolls.map((roll) => [roll.rollCode, `${roll.remainingMeters} م متبقي`, roll.location || 'لا يوجد موقع'])} empty="لا توجد رولات منخفضة." /></Panel>
    </section>
  </>
}
