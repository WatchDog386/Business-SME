import * as React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Flag, FolderX, PieChart, Plus, ShoppingCart, Wallet } from 'lucide-react';
import type { DashboardData } from '@/api/types';
import { budgetsApi } from '@/api/endpoints';
import { KpiCard } from '@/components/desktop/kpi-card';
import { useRole } from '@/hooks/use-role';
import { cn, formatKES, formatTime } from '@/lib/utils';

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Desktop-only dashboard (lg and up), Command Center style. Phones use the stacked mobile dashboard. */
export function DesktopDashboard({ data }: { data: DashboardData }) {
  const { canApprove } = useRole();
  const budgetsQuery = useQuery({
    queryKey: ['budgets', 'status', 'current'],
    queryFn: () => budgetsApi.status(),
  });
  const budgets = budgetsQuery.data?.items ?? [];
  const budgetLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  const budgetSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const budgetUsed = pct(budgetSpent, budgetLimit);

  const { today } = data;
  const grossMargin = pct(today.grossProfit, today.sales);
  const debtors = data.recentCustomers.filter((c) => c.outstanding_balance > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[28px] font-normal tracking-tight text-foreground">Command Center</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/expenses?new=1"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-edge bg-surface px-3.5 text-[13px] font-medium text-foreground-2 transition-colors hover:bg-surface-2"
          >
            <Wallet className="h-4 w-4" aria-hidden />
            {canApprove ? 'Add expense' : 'Submit expense'}
          </Link>
          <Link
            to="/sales/new"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Record sale
          </Link>
        </div>
      </div>

      {/* Date scope chips (display only: the figures below are today / last 30 days) */}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-edge bg-surface px-3 text-[12.5px] text-foreground-3">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Filter by date
        </span>
        <span className="inline-flex h-8 items-center rounded-md border border-edge bg-surface px-3 text-[12.5px] text-foreground-3">
          Date is Today · Last 30 days
        </span>
        <span className="ml-auto inline-flex h-8 items-center rounded-md border border-edge bg-surface px-3 text-[12.5px] font-medium text-foreground-2">
          KES
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard tone="blue" icon={Wallet} value={formatKES(data.monthRevenue)} label="Revenue" note="Last 30 days" to="/reports" />
        <KpiCard
          tone="green"
          icon={ShoppingCart}
          value={formatKES(today.sales)}
          label="Sales today"
          note={`${today.salesCount} sale${today.salesCount === 1 ? '' : 's'}`}
          to="/sales"
        />
        <KpiCard
          tone="yellow"
          icon={Flag}
          value={String(data.pendingApprovals)}
          label="Awaiting approval"
          note="Expenses to review"
          to="/expenses?status=PENDING"
        />
        <KpiCard
          tone="red"
          icon={PieChart}
          value={formatKES(today.expenses)}
          label="Expenses today"
          note={`Net ${formatKES(today.netProfit)}`}
          to="/expenses"
        />
      </div>

      <section className="-mx-6 border-y border-edge bg-surface">
        <div className="px-6 py-5">
          <h2 className="mb-4 text-[17px] font-normal text-foreground">Revenue breakdown</h2>
          <RevenueBreakdown products={data.topProducts} />
        </div>
        <div className="grid grid-cols-3 divide-x divide-edge border-t border-edge">
          <HealthCell title="Gross margin">
            {today.sales > 0 ? (
              <Donut value={grossMargin} color="#198754" caption="of sales today" />
            ) : (
              <MiniEmpty title="No sales" note="There are no sales yet today." />
            )}
          </HealthCell>
          <HealthCell title="Budget used">
            {budgetLimit > 0 ? (
              <Donut
                value={budgetUsed}
                color={budgetUsed > 100 ? '#DC3545' : '#0D6EFD'}
                caption={`${formatKES(budgetSpent)} of ${formatKES(budgetLimit)}`}
              />
            ) : (
              <MiniEmpty title="No budgets" note={budgetsQuery.isLoading ? 'Loading…' : 'Set monthly limits on Budgets.'} />
            )}
          </HealthCell>
          <HealthCell title="Customers owing">
            {debtors.length > 0 ? (
              <div className="flex flex-col items-center py-2 text-center">
                <p className="text-[24px] font-semibold tabular-nums text-red-600 [.dark_&]:text-red-400">
                  {formatKES(data.outstandingDebts)}
                </p>
                <p className="mt-1 text-[12px] text-foreground-4">
                  {debtors.length} customer{debtors.length === 1 ? '' : 's'} with unpaid credit sales
                </p>
                <Link
                  to="/customers"
                  className="mt-3 inline-flex h-8 items-center rounded-md bg-accent px-4 text-[12.5px] font-medium text-white hover:bg-accent-strong"
                >
                  Collect payment
                </Link>
              </div>
            ) : (
              <MiniEmpty title="Nothing owed" note="No customers owe money right now." />
            )}
          </HealthCell>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
        <ActivityPanel data={data} />
        <Panel
          title="Products & budgets"
          action={
            <div className="flex gap-4">
              <Link to="/reports" className="hover:underline">
                Reports
              </Link>
              <Link to="/budgets" className="hover:underline">
                Budgets
              </Link>
            </div>
          }
        >
          <MiniTable
            headers={['Product', 'Sold', 'Revenue']}
            rows={data.topProducts.slice(0, 4).map((p) => [p.name, String(Number(p.quantity)), formatKES(Number(p.revenue))])}
            empty="No sales in the last 30 days."
          />
          <div className="mt-4 border-t border-edge pt-3">
            <MiniTable
              headers={['Budget', 'Spent', 'Used']}
              rows={budgets.slice(0, 4).map((b) => [b.category_name, formatKES(b.spent), `${b.percent}%`])}
              highlight={budgets.slice(0, 4).map((b) => b.level !== 'OK')}
              empty={budgetsQuery.isLoading ? 'Loading…' : 'No budgets set.'}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** Horizontal bars of the top products' 30-day revenue (CSS bars, no chart library). */
function RevenueBreakdown({ products }: { products: DashboardData['topProducts'] }) {
  const rows = products.slice(0, 6).map((p) => ({ name: p.name, revenue: Number(p.revenue) }));
  const max = Math.max(...rows.map((r) => r.revenue), 0);

  if (max <= 0) {
    return <MiniEmpty title="No revenue" note="There's no revenue for this date range. Recorded sales will show up here." />;
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.name} className="grid grid-cols-[11rem_minmax(0,1fr)_7rem] items-center gap-3">
          <p className="truncate text-[12.5px] text-foreground-3">{row.name}</p>
          <div className="h-5 overflow-hidden rounded-sm bg-surface-2">
            <div className="h-full rounded-sm bg-accent" style={{ width: `${Math.max(2, Math.round((row.revenue / max) * 100))}%` }} />
          </div>
          <p className="text-right text-[12.5px] font-medium tabular-nums text-foreground-2">{formatKES(row.revenue)}</p>
        </div>
      ))}
    </div>
  );
}

function HealthCell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col px-5 py-5">
      <h2 className="mb-3 text-[17px] font-normal text-foreground">{title}</h2>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </section>
  );
}

/** Small centred empty state used inside dashboard panels. */
function MiniEmpty({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <FolderX className="h-8 w-8 text-accent" strokeWidth={1.5} aria-hidden />
      <p className="mt-2 text-[15px] text-foreground-2">{title}</p>
      <p className="mt-1 max-w-[15rem] text-[12.5px] text-foreground-3">{note}</p>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-edge bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-medium text-foreground">{title}</h2>
        {action && <div className="text-[12px] font-medium text-accent">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function ActivityPanel({ data }: { data: DashboardData }) {
  const rows = data.recentTransactions.slice(0, 6);
  return (
    <Panel
      title="Recent activity"
      action={
        <Link to="/sales" className="hover:underline">
          All sales
        </Link>
      }
    >
      {rows.length === 0 ? (
        <MiniEmpty title="No transactions found" note="Sales and approved expenses will show up here." />
      ) : (
        <ul>
          {rows.map((t) => {
            const isSale = t.type === 'SALE';
            return (
              <li key={`${t.type}-${t.id}`} className="border-b border-edge/70 last:border-0">
                <Link
                  to={isSale ? `/sales/${t.id}` : '/expenses'}
                  className="grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-3 px-1 py-2.5 text-[13px] transition-colors hover:bg-surface-2"
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', isSale ? 'bg-emerald-500' : 'bg-red-500')} aria-hidden />
                  <span className="truncate text-foreground-2">{t.description}</span>
                  <span className="truncate text-foreground-4">
                    {isSale ? (t.customerName ?? 'Walk-in') : 'Expense'} · {formatTime(t.createdAt)}
                  </span>
                  <span className={cn('text-right font-medium tabular-nums', isSale ? 'text-foreground' : 'text-red-600 [.dark_&]:text-red-400')}>
                    {isSale ? '' : '−'}
                    {formatKES(t.amount)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function Donut({ value, color, caption }: { value: number; color: string; caption: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(100, value));
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90" role="img" aria-label={`${value}%`}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth="9" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(shown / 100) * c} ${c}`} />
        <text x="44" y="48" textAnchor="middle" className="rotate-90 fill-foreground font-semibold" style={{ transformOrigin: '44px 44px', fontSize: 15 }}>
          {value}%
        </text>
      </svg>
      <figcaption className="mt-1 text-center text-[12px] text-foreground-4">{caption}</figcaption>
    </figure>
  );
}

function MiniTable({ headers, rows, highlight, empty }: { headers: string[]; rows: string[][]; highlight?: boolean[]; empty: string }) {
  if (rows.length === 0) return <p className="py-4 text-center text-[12.5px] text-foreground-4">{empty}</p>;
  return (
    <table className="w-full table-fixed text-[12.5px]">
      <thead>
        <tr className="border-b border-edge text-left text-foreground-4">
          {headers.map((h, i) => (
            <th key={h} className={cn('pb-1.5 font-normal', i > 0 && 'w-20 text-right')}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.join('|')} className={cn('border-b border-edge/60 last:border-0', highlight?.[i] ? 'text-red-600 [.dark_&]:text-red-400' : 'text-foreground-2')}>
            {row.map((cell, j) => (
              <td key={j} className={cn('truncate py-2', j > 0 && 'text-right tabular-nums', j === 0 && 'font-medium')}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
