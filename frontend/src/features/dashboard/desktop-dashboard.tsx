import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  PackageX,
  Plus,
  RefreshCcw,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardData } from '@/api/types';
import { budgetsApi } from '@/api/endpoints';
import { useRole } from '@/hooks/use-role';
import { cn, formatKES, formatTime } from '@/lib/utils';

const TZ = 'Africa/Nairobi';

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Desktop-only dashboard (lg and up). Phones use the stacked mobile dashboard. */
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
  const netMargin = pct(today.netProfit, today.sales);
  const expenseRatio = pct(today.expenses, today.sales);
  const weekShare = pct(data.weekRevenue, data.monthRevenue);
  const debtors = data.recentCustomers.filter((c) => c.outstanding_balance > 0);

  const dateLabel = new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date());

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-900 [.dark_&]:text-white">Dashboard</h1>
          <p className="mt-1 text-base font-semibold text-foreground-2">Analytics overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/expenses?new=1"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-edge bg-surface px-4 text-xs font-semibold text-foreground-2 shadow-sm transition-colors hover:bg-surface-2"
          >
            <Wallet className="h-4 w-4" aria-hidden />
            {canApprove ? 'Add expense' : 'Submit expense'}
          </Link>
          <Link
            to="/sales/new"
            className="inline-flex h-9 items-center gap-2 rounded-full bg-red-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Record sale
          </Link>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile tone="red" icon={Wallet} label={`Expenses · ${dateLabel}`} value={formatKES(today.expenses)} />
        <StatTile tone="navy" icon={ShoppingCart} label="Sales today" value={formatKES(today.sales)} />
        <StatTile tone="blue" icon={RefreshCcw} label="Net profit today" value={formatKES(today.netProfit)} />
        <StatTile tone="gray" icon={FileText} label="Last 30 days" value={formatKES(data.monthRevenue)} />
      </div>

      {/* Data in numbers */}
      <div>
        <div className="flex items-end justify-between text-xs">
          <p className="font-bold uppercase tracking-wide text-brand-900 [.dark_&]:text-white">
            Data in numbers {dateLabel}
          </p>
          <p className="text-foreground-4">
            Budget used this month{' '}
            <span className="ml-1 text-xl font-bold text-brand-900 [.dark_&]:text-white">{budgetUsed}%</span>
          </p>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className={cn('h-full rounded-full', budgetUsed > 100 ? 'bg-red-600' : 'bg-brand-600')}
            style={{ width: `${Math.min(100, budgetUsed)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_17rem] gap-5">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5">
            <ActivityPanel data={data} />
            <Panel title="Overall efficiency" center>
              <div className="flex items-center justify-around py-2">
                <Donut value={grossMargin} color="#1D6A2C" label="Gross margin" caption="today" />
                <Donut
                  value={budgetUsed}
                  color="#DC2626"
                  label="Budget used"
                  caption={formatKES(budgetSpent)}
                />
              </div>
            </Panel>
          </div>

          <Panel
            title="Products & budgets"
            action={
              <div className="flex gap-4">
                <Link to="/reports" className="hover:underline">
                  products report
                </Link>
                <Link to="/budgets" className="hover:underline">
                  all budgets
                </Link>
              </div>
            }
          >
            <div className="grid grid-cols-2 items-start gap-6">
              <MiniTable
                headers={['Rank', 'Product', 'Sold', 'Revenue']}
                rows={data.topProducts
                  .slice(0, 6)
                  .map((p, i) => [String(i + 1), p.name, String(Number(p.quantity)), formatKES(Number(p.revenue))])}
                empty="No sales in the last 30 days."
              />
              <MiniTable
                headers={['Category', 'Spent', 'Limit', 'Used']}
                rows={budgets.map((b) => [b.category_name, formatKES(b.spent), formatKES(b.limit), `${b.percent}%`])}
                highlight={budgets.map((b) => b.level !== 'OK')}
                empty={budgetsQuery.isLoading ? 'Loading…' : 'No budgets set.'}
              />
            </div>
          </Panel>

          <div>
            <h2 className="mb-3 text-lg font-bold text-brand-900 [.dark_&]:text-white">Effectivity indicators</h2>
            <div className="grid grid-cols-5 gap-3">
              <IndicatorTile icon={ShoppingCart} value={today.salesCount} label="Sales today" to="/sales" />
              <IndicatorTile
                icon={ClipboardCheck}
                value={data.pendingApprovals}
                label="Awaiting approval"
                to="/expenses?status=PENDING"
                alert={data.pendingApprovals > 0}
              />
              <IndicatorTile icon={PackageX} value={data.lowStock} label="Low stock" to="/products" alert={data.lowStock > 0} />
              <IndicatorTile
                icon={AlertTriangle}
                value={data.budgetAlerts?.length ?? 0}
                label="Budget alerts"
                to="/budgets"
                alert={(data.budgetAlerts?.length ?? 0) > 0}
              />
              <IndicatorTile icon={Users} value={debtors.length} label="Customers owing" to="/customers" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="mb-3 text-lg font-bold text-brand-900 [.dark_&]:text-white">General indicators</h2>
            <div className="space-y-2.5">
              <GaugeRow label="Net margin" value={netMargin} caption="today" />
              <GaugeRow label="Expense ratio" value={expenseRatio} caption="of sales" danger={expenseRatio > 50} />
              <GaugeRow label="Weekly share" value={weekShare} caption="of 30 days" />
              <GaugeRow label="Budget used" value={budgetUsed} caption="this month" danger={budgetUsed > 100} />
            </div>
          </div>
          <AccountsCard outstanding={data.outstandingDebts} debtors={debtors.length} />
        </div>
      </div>
    </div>
  );
}

const TILE_TONES = {
  red: 'bg-red-600',
  navy: 'bg-brand-800',
  blue: 'bg-brand-400',
  gray: 'bg-slate-400 [.dark_&]:bg-slate-600',
};

function StatTile({
  tone,
  icon: Icon,
  label,
  value,
}: {
  tone: keyof typeof TILE_TONES;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl p-3 text-white shadow-md', TILE_TONES[tone])}>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-white/70">
        <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-right">
        <p className="truncate text-[11px] text-white/80">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold tabular-nums tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  center,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-edge bg-surface p-4 shadow-sm">
      <div className={cn('mb-3 flex items-center gap-3', center ? 'justify-center' : 'justify-between')}>
        <h2 className="text-xs font-bold uppercase tracking-wide text-brand-900 [.dark_&]:text-white">{title}</h2>
        {action && <div className="text-[11px] font-medium text-brand-600">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function ActivityPanel({ data }: { data: DashboardData }) {
  const rows = data.recentTransactions.slice(0, 5);
  return (
    <section className="rounded-xl border border-edge bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-brand-900 [.dark_&]:text-white">Recent activity</h2>
          <p className="text-[11px] text-foreground-5">Sales and approved expenses</p>
        </div>
        <dl className="text-right text-[11px] leading-5 text-foreground-4">
          <div>
            Week revenue: <dd className="inline font-semibold text-red-600">{formatKES(data.weekRevenue)}</dd>
          </div>
          <div>
            Gross profit today: <dd className="inline font-semibold text-red-600">{formatKES(data.today.grossProfit)}</dd>
          </div>
          <div>
            Sales today: <dd className="inline font-semibold text-foreground">{data.today.salesCount}</dd>
          </div>
        </dl>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-xs text-foreground-5">No activity yet.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {rows.map((t, i) => {
            const isSale = t.type === 'SALE';
            const first = i === 0;
            return (
              <li key={`${t.type}-${t.id}`}>
                <Link
                  to={isSale ? `/sales/${t.id}` : '/expenses'}
                  className={cn(
                    'grid grid-cols-[1.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-1.5 text-[11px] transition-colors',
                    first ? 'bg-brand-800 text-white' : 'text-foreground-2 hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full',
                      first ? 'bg-white/20' : isSale ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                    )}
                    aria-hidden
                  >
                    {isSale ? <ShoppingCart className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
                  </span>
                  <span className="truncate font-medium">{t.description}</span>
                  <span className={cn('truncate', first ? 'text-white/80' : 'text-foreground-5')}>
                    {isSale ? (t.customerName ?? 'Walk-in') : 'Expense'} · {formatTime(t.createdAt)}
                  </span>
                  <span className="text-right font-semibold tabular-nums">
                    {isSale ? '' : '−'}
                    {formatKES(t.amount)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Donut({ value, color, label, caption }: { value: number; color: string; label: string; caption: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(100, value));
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90" role="img" aria-label={`${label} ${value}%`}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="10" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * c} ${c}`}
        />
        <text
          x="44"
          y="48"
          textAnchor="middle"
          className="rotate-90 fill-foreground font-bold"
          style={{ transformOrigin: '44px 44px', fontSize: 15 }}
        >
          {value}%
        </text>
      </svg>
      <figcaption className="mt-1 text-center">
        <p className="text-[11px] font-medium text-foreground-2">{label}</p>
        <p className="text-[10px] text-foreground-5">{caption}</p>
      </figcaption>
    </figure>
  );
}

function GaugeRow({ label, value, caption, danger }: { label: string; value: number; caption: string; danger?: boolean }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center justify-between rounded-xl border border-edge bg-surface px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-foreground-3">{label}</p>
      <svg viewBox="0 0 40 40" className="h-14 w-14 -rotate-90" role="img" aria-label={`${label} ${value}%`}>
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={danger ? '#DC2626' : '#1D6A2C'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * c} ${c}`}
          className={danger ? undefined : '[.dark_&]:[stroke:#9FDCAB]'}
        />
        <text
          x="20"
          y="23"
          textAnchor="middle"
          className="rotate-90 fill-foreground font-bold"
          style={{ transformOrigin: '20px 20px', fontSize: 9 }}
        >
          {value}%
        </text>
      </svg>
      <p className="w-16 text-right text-[11px] text-foreground-5">{caption}</p>
    </div>
  );
}

function MiniTable({
  headers,
  rows,
  highlight,
  empty,
}: {
  headers: string[];
  rows: string[][];
  highlight?: boolean[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="py-6 text-center text-xs text-foreground-5">{empty}</p>;
  return (
    <table className="w-full table-fixed text-[11px]">
      <thead>
        <tr className="border-b border-edge text-left text-foreground-4">
          {headers.map((h, i) => (
            <th key={h} className={cn('pb-1.5 font-medium', i === 0 && (h === 'Rank' ? 'w-12' : 'w-28'), i > 1 && 'text-right')}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.join('|')} className={cn('border-b border-edge/60 last:border-0', highlight?.[i] && 'text-red-600')}>
            {row.map((cell, j) => (
              <td key={j} className={cn('truncate py-1.5', j > 1 && 'text-right tabular-nums', j === 1 && 'font-medium')}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IndicatorTile({
  icon: Icon,
  value,
  label,
  to,
  alert,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  to: string;
  alert?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center rounded-xl border border-edge bg-surface px-3 py-4 text-center shadow-sm transition-shadow hover:shadow-md"
    >
      <Icon className={cn('h-8 w-8', alert ? 'text-red-600' : 'text-brand-700 [.dark_&]:text-brand-200')} strokeWidth={1.5} aria-hidden />
      <p className="mt-2 text-2xl font-bold tabular-nums text-brand-900 [.dark_&]:text-white">{value}</p>
      <p className="text-[11px] text-foreground-4">{label}</p>
    </Link>
  );
}

function AccountsCard({ outstanding, debtors }: { outstanding: number; debtors: number }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold text-brand-900 [.dark_&]:text-white">Accounts</h2>
      <div className="relative overflow-hidden rounded-xl border border-edge bg-surface p-4 shadow-sm">
        <p className="text-xs text-foreground-3">
          {debtors} customer{debtors === 1 ? '' : 's'} owing:{' '}
          <span className="font-bold text-red-600">{formatKES(outstanding)}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-foreground-5">Credit sales not yet paid</p>
        <Link
          to="/customers"
          className="mt-3 inline-flex h-8 items-center rounded-md bg-red-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
        >
          Collect payment
        </Link>
        <DeskIllustration />
      </div>
    </section>
  );
}

/** Small flat "person at a desk" illustration, in brand colours. */
function DeskIllustration() {
  return (
    <svg viewBox="0 0 160 110" className="mt-2 h-28 w-full" aria-hidden>
      <rect x="18" y="74" width="124" height="6" rx="2" fill="#1D6A2C" />
      <rect x="30" y="80" width="5" height="26" fill="#1D6A2C" />
      <rect x="125" y="80" width="5" height="26" fill="#1D6A2C" />
      <rect x="62" y="44" width="46" height="30" rx="3" fill="#34A94B" />
      <rect x="66" y="48" width="38" height="20" rx="1.5" fill="#EAF7ED" />
      <rect x="70" y="58" width="5" height="8" fill="#DC2626" />
      <rect x="78" y="54" width="5" height="12" fill="#2DA043" />
      <rect x="86" y="51" width="5" height="15" fill="#45B65C" />
      <rect x="94" y="56" width="5" height="10" fill="#2DA043" />
      <circle cx="122" cy="40" r="9" fill="#F5C7A9" />
      <path d="M113 38 q9 -12 18 0 v-4 q-9 -10 -18 0z" fill="#1F2937" />
      <path d="M108 74 q2 -24 14 -24 q12 0 14 24z" fill="#DC2626" />
      <path d="M112 62 l-10 6" stroke="#F5C7A9" strokeWidth="4" strokeLinecap="round" />
      <rect x="20" y="58" width="10" height="16" rx="2" fill="#9FDCAB" />
      <path d="M25 58 q-6 -12 0 -20 q6 8 0 20z" fill="#22C55E" />
    </svg>
  );
}
