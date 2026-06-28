import type { AccountBalance, Currency, FinancialStatements } from '@/app/_lib/types'
import { formatMoney } from '@/app/_lib/format'
import { labelAccountName } from '@/features/shared/constants/labels'
import { TableShell, tableClass, tdClass, thClass } from '@/app/_components/ui'

function MoneyColumns({ balance }: { balance?: Record<Currency, number> }) {
  return <><td className={tdClass('font-semibold text-slate-950')}>{formatMoney(balance?.USD ?? 0, 'USD')}</td><td className={tdClass('font-semibold text-slate-950')}>{formatMoney(balance?.SYP ?? 0, 'SYP')}</td></>
}

function StatementLine({ label, balance, strong = false }: { label: string; balance?: Record<Currency, number>; strong?: boolean }) {
  return <tr className={strong ? 'bg-slate-50' : ''}><td className={tdClass(strong ? 'font-semibold text-slate-950' : '')}>{label}</td><MoneyColumns balance={balance} /></tr>
}

function BalanceSection({ title, rows }: { title: string; rows: AccountBalance[] }) {
  return <><tr><td colSpan={3} className={tdClass('bg-slate-50 text-xs font-semibold uppercase text-slate-500')}>{title}</td></tr>{rows.map((row) => <StatementLine key={row.account.id} label={`${row.account.code} ${labelAccountName(row.account.name)}`} balance={row.balance} />)}</>
}

export function ProfitAndLossView({ statements }: { statements: FinancialStatements | null }) {
  const profit = statements?.profitAndLoss
  return <TableShell><table className={tableClass()}><thead><tr><th className={thClass()}>البند</th><th className={thClass()}>USD</th><th className={thClass()}>SYP</th></tr></thead><tbody><StatementLine label="إيرادات المبيعات" balance={profit?.revenue} /><StatementLine label="تكلفة البضاعة المباعة" balance={profit?.cogs} /><StatementLine label="مجمل الربح" balance={profit?.grossProfit} strong /><StatementLine label="المصاريف التشغيلية" balance={profit?.operatingExpenses} /><StatementLine label="صافي الربح" balance={profit?.netProfit} strong /></tbody></table></TableShell>
}

export function BalanceSheetView({ statements }: { statements: FinancialStatements | null }) {
  const sheet = statements?.balanceSheet
  return <TableShell><table className={tableClass()}><thead><tr><th className={thClass()}>الحساب</th><th className={thClass()}>USD</th><th className={thClass()}>SYP</th></tr></thead><tbody><BalanceSection title="الأصول" rows={sheet?.assets ?? []} /><StatementLine label="إجمالي الأصول" balance={sheet?.totals.assets} strong /><BalanceSection title="الالتزامات" rows={sheet?.liabilities ?? []} /><StatementLine label="إجمالي الالتزامات" balance={sheet?.totals.liabilities} strong /><BalanceSection title="حقوق الملكية" rows={sheet?.equity ?? []} /><StatementLine label="أرباح الفترة الحالية" balance={sheet?.currentEarnings} /><StatementLine label="إجمالي حقوق الملكية" balance={sheet?.totals.equity} strong /><StatementLine label="الالتزامات وحقوق الملكية" balance={sheet?.totals.liabilitiesAndEquity} strong /></tbody></table></TableShell>
}
