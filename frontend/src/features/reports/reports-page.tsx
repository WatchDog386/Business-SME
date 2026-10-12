import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Download,
  Landmark,
  Receipt,
  RefreshCw,
  Smartphone,
  TrendingUp,
  UserPlus,
  Wallet,
  Wifi,
  X,
} from 'lucide-react';
import { reportsApi, type DailyReport } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/spinner';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { cn, formatKES } from '@/lib/utils';
import { barColor, barStripes } from '@/lib/chart-colors';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { DesktopReportsPage } from './desktop-reports-page';

const TZ = 'Africa/Nairobi';
const isoDay = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const DAY = 86_400_000;

/** YYYY-MM-DD in Nairobi, `offset` days from today. */
function nairobiDay(offset = 0): string {
  return isoDay.format(new Date(Date.now() + offset * DAY));
}

/** "Today", "Yesterday" or "Fri 10 Oct". */
function dayLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  const d = new Date(`${date}T12:00:00+03:00`);
  if (isoDay.format(new Date(d.getTime() + DAY)) === today) return 'Yesterday';
  return d.toLocaleDateString('en-KE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
}

function shortDay(date: string): { weekday: string; day: string } {
  const d = new Date(`${date}T12:00:00+03:00`);
  return {
    weekday: d.toLocaleDateString('en-KE', { timeZone: TZ, weekday: 'short' }),
    day: d.toLocaleDateString('en-KE', { timeZone: TZ, day: 'numeric' }),
  };
}

function updatedText(r: DailyReport): string {
  if (r.closed) return 'Final · closed at midnight';
  const mins = Math.max(0, Math.round((Date.now() - new Date(r.generatedAt).getTime()) / 60000));
  return mins < 1 ? 'Live · updated just now' : `Live · updated ${mins} min ago`;
}

/** Plain-text summary for WhatsApp. */
function summaryText(r: DailyReport, label: string): string {
  const lines = [
    `*Optimas daily report: ${label} (${r.date})*`,
    r.closed ? '' : '_So far today_',
    '',
    `Revenue: ${formatKES(r.revenue.total)} (${r.revenue.salesCount} sales)`,
    `Collected: ${formatKES(r.revenue.collected)}`,
    `Expenses: ${formatKES(r.expenses.total)}${r.expenses.pendingCount ? ` (+${r.expenses.pendingCount} awaiting approval)` : ''}`,
    `Net profit: ${formatKES(r.profit.net)}`,
    `Cash in hand: ${formatKES(r.cash.net)}`,
    '',
    `WiFi packages: ${r.packages.sold} sold, ${r.packages.newSubscribers} new, ${r.packages.renewals} renewals`,
    `Subscribers: ${r.subscribers.active} active, ${r.subscribers.expiring} expiring, ${r.subscribers.expired} expired`,
    `Owed by clients: ${formatKES(r.debts.outstanding)} (${r.debts.debtors})`,
  ];
  return lines.filter((l, i) => l !== '' || lines[i - 1] !== '').join('\n');
}

const METHOD_STYLE: Record<string, { label: string; icon: typeof Wallet; tint: string; ink: string }> = {
  'M-PESA': { label: 'M-Pesa', icon: Smartphone, tint: '#DCEFD9', ink: '#2DA043' },
  CASH: { label: 'Cash', icon: Banknote, tint: '#F3EAD3', ink: '#B7791F' },
  BANK: { label: 'Bank', icon: Landmark, tint: '#DDE4F3', ink: '#3B5BA9' },
  CARD: { label: 'Card', icon: CreditCard, tint: '#EADDF3', ink: '#7E3BA9' },
  CREDIT: { label: 'On credit', icon: Receipt, tint: '#F3DDDD', ink: '#C0392B' },
};

/**
 * Daily report: each day closes at midnight (Nairobi). Today's is live; any
 * past day can be opened, shared on WhatsApp or downloaded as a PDF.
 */
export function ReportsPage() {
  const isDesktop = useIsDesktop();
  const [searchParams] = useSearchParams();
  // Desktop opens the period overview; ?view=daily (or phones) opens the daily report
  if (isDesktop && searchParams.get('view') !== 'daily') return <DesktopReportsPage />;
  return <DailyReportPage />;
}

function DailyReportPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const today = nairobiDay();
  // ?date=YYYY-MM-DD opens that day (e.g. from the "Yesterday's report" notification)
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(() => {
    const wanted = searchParams.get('date');
    return wanted && /^\d{4}-\d{2}-\d{2}$/.test(wanted) && wanted <= today ? wanted : today;
  });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const report = useQuery({ queryKey: ['daily-report', date], queryFn: () => reportsApi.day(date), refetchInterval: date === today ? 60_000 : false });
  const history = useQuery({ queryKey: ['daily-report-history', today], queryFn: () => reportsApi.dayHistory(7, today) });
  const r = report.data;
  const label = dayLabel(date, today);

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await reportsApi.download('day/export.pdf', { date }, `daily-report-${date}.pdf`);
    } catch (err) {
      setDownloadError(apiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const change = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : null);

  return (
    <div className="space-y-5 pb-10">
      {/* Header like the reference: greeting, then the selected day as a chip */}
      <header className="page-head flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(isDesktop ? '/reports' : '/dashboard')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-foreground active:scale-90"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">Daily report</h1>
          <p className="text-[12px] text-foreground-4">How the business did, day by day</p>
        </div>
        <button
          type="button"
          onClick={download}
          disabled={downloading || !r}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-foreground active:scale-90 disabled:opacity-50"
          aria-label="Download PDF"
        >
          {downloading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-5 w-5" />}
        </button>
      </header>

      {/* Day picker: last 7 days */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
        {(history.data ?? []).slice().reverse().map((h) => {
          const { weekday, day } = shortDay(h.date);
          const active = h.date === date;
          return (
            <button
              key={h.date}
              type="button"
              onClick={() => setDate(h.date)}
              className={cn(
                'flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-center transition-colors',
                active ? 'bg-[#1C1F1B] text-white [.dark_&]:bg-white [.dark_&]:text-[#1C1F1B]' : 'bg-white text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.06)] [.dark_&]:bg-white/10',
              )}
            >
              <span className={cn('text-[11px]', active ? 'opacity-70' : 'text-foreground-4')}>{h.date === today ? 'Today' : weekday}</span>
              <span className="text-[17px] font-semibold tabular-nums">{day}</span>
            </button>
          );
        })}
        <label className="relative flex h-16 w-14 shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl bg-white text-[11px] text-foreground-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] [.dark_&]:bg-white/10">
          <ChevronDown className="h-4 w-4" aria-hidden />
          Older
          <input
            type="date"
            max={today}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="absolute inset-0 opacity-0"
            aria-label="Pick a day"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white pl-3.5 pr-2 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.06)] [.dark_&]:bg-white/10">
          {label}
          {date !== today && (
            <button type="button" onClick={() => setDate(today)} className="flex h-6 w-6 items-center justify-center rounded-full text-foreground-4" aria-label="Back to today">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
        {r && <span className="text-[12px] text-foreground-4">{updatedText(r)}</span>}
      </div>

      {report.error && <Alert variant="error">{apiErrorMessage(report.error)}</Alert>}
      {downloadError && <Alert variant="error">{downloadError}</Alert>}
      {report.isLoading && <PageLoader inline message="Loading" />}

      {r && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              tone="lavender"
              note={updatedText(r)}
              title="Revenue"
              count={r.revenue.salesCount}
              countLabel={r.revenue.salesCount === 1 ? 'Sale' : 'Sales'}
              more={{ label: 'Sales', to: '/sales' }}
            >
              <Tile label="Total revenue" sub="Generated" value={formatKES(r.revenue.total)} icon={TrendingUp} delta={change(r.revenue.total, r.previous.revenue)} />
              <Tile label="Collected" sub={r.revenue.unpaid ? `${r.revenue.unpaid} not fully paid` : 'All paid'} value={formatKES(r.revenue.collected)} icon={Wallet} />
            </Panel>

            <Panel tone="mint" note={updatedText(r)} title="Expenses" count={r.expenses.count} countLabel={r.expenses.count === 1 ? 'Item' : 'Items'} more={{ label: 'Expenses', to: '/expenses' }}>
              <Tile label="Total spent" sub="Approved" value={formatKES(r.expenses.total)} icon={Receipt} delta={change(r.expenses.total, r.previous.expenses)} invert />
              <Tile label="Awaiting approval" sub={`${r.expenses.pendingCount} pending`} value={formatKES(r.expenses.pendingTotal)} icon={RefreshCw} />
            </Panel>

            <Panel tone="sand" note={`${r.profit.margin}% of revenue kept`} title="Profit" count={r.profit.margin} countLabel="% margin">
              <Tile label="Net profit" sub="Revenue less costs" value={formatKES(r.profit.net)} icon={TrendingUp} delta={change(r.profit.net, r.previous.net)} />
              <Tile label="Cash in hand" sub="Collected less spent" value={formatKES(r.cash.net)} icon={Banknote} />
            </Panel>

            <Panel tone="sky" note={`${formatKES(r.packages.revenue)} from packages`} title="WiFi packages" count={r.packages.sold} countLabel="Sold" more={{ label: 'Subscribers', to: '/subscribers' }}>
              <Tile label="New subscribers" sub="First package" value={String(r.packages.newSubscribers)} icon={UserPlus} />
              <Tile label="Renewals" sub="Paid again" value={String(r.packages.renewals)} icon={RefreshCw} />
            </Panel>
          </div>

          {/* Last 7 days: tap a bar to open that day */}
          {history.data && <WeekChart rows={history.data} selected={date} today={today} onSelect={setDate} />}

          {/* Money in by method: side-scrolling cards */}
          <section>
            <SectionTitle title="Money in" right={formatKES(r.revenue.collected)} />
            {r.revenue.collectedByMethod.length === 0 ? (
              <p className="px-1 text-[13px] text-foreground-4">No payments on this day.</p>
            ) : (
              <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4">
                {r.revenue.collectedByMethod.map((m) => {
                  const st = METHOD_STYLE[m.method] ?? { label: m.method, icon: Wallet, tint: '#E9ECEF', ink: '#495057' };
                  const Icon = st.icon;
                  return (
                    <div key={m.method} className="w-32 shrink-0 overflow-hidden rounded-3xl bg-[#F2F2F4] [.dark_&]:bg-[#1E1E1E]">
                      <div className="flex h-16 items-center justify-center" style={{ background: st.tint }}>
                        <Icon className="h-7 w-7" style={{ color: st.ink }} aria-hidden />
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-[13px] font-semibold text-foreground">{st.label}</p>
                        <p className="text-[11px] text-foreground-4">{m.count} payment{m.count === 1 ? '' : 's'}</p>
                        <p className="mt-1 text-[14px] font-semibold tabular-nums text-foreground">{formatKES(m.total)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section>
              <SectionTitle title="Packages sold" right={`${r.packages.sold}`} />
              <Rows rows={r.packages.lines.map((p) => ({ key: p.name, left: `${p.quantity} × ${p.name}`, right: formatKES(p.revenue) }))} empty="No packages sold." />
              {r.products.length > 0 && (
                <>
                  <SectionTitle title="Products and services" right={`${r.products.length}`} className="mt-5" />
                  <Rows rows={r.products.map((p) => ({ key: p.name, left: `${p.quantity} × ${p.name}`, right: formatKES(p.revenue) }))} />
                </>
              )}
            </section>

            <section>
              <SectionTitle title="Spending by category" right={formatKES(r.expenses.total)} />
              {r.expenses.byCategory.length === 0 ? (
                <p className="px-1 text-[13px] text-foreground-4">No approved expenses.</p>
              ) : (
                <ul className="space-y-3 px-1">
                  {r.expenses.byCategory.map((c) => (
                    <li key={c.category}>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-foreground-2">{c.category}</span>
                        <span className="font-medium tabular-nums text-foreground">{formatKES(c.amount)}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F2F2F4] [.dark_&]:bg-white/10">
                        <div className="h-full rounded-full bg-[#E23B41]" style={{ width: `${Math.max(4, (c.amount / (r.expenses.total || 1)) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Subscribers and balances */}
          <section>
            <SectionTitle title="Subscribers" right={r.closed ? 'At end of day' : 'Right now'} />
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Active', value: r.subscribers.active, cls: 'bg-emerald-50 text-emerald-700 [.dark_&]:bg-emerald-500/10 [.dark_&]:text-emerald-300' },
                { label: 'Expiring soon', value: r.subscribers.expiring, cls: 'bg-amber-50 text-amber-700 [.dark_&]:bg-amber-500/10 [.dark_&]:text-amber-300' },
                { label: 'Expired', value: r.subscribers.expired, cls: 'bg-red-50 text-red-700 [.dark_&]:bg-red-500/10 [.dark_&]:text-red-300' },
              ].map((s) => (
                <div key={s.label} className={cn('rounded-2xl p-3', s.cls)}>
                  <p className="text-[22px] font-semibold tabular-nums">{s.value}</p>
                  <p className="text-[11px] font-medium opacity-80">{s.label}</p>
                </div>
              ))}
            </div>
            <Link to="/customers" className="mt-3 flex items-center justify-between rounded-2xl bg-[#F2F2F4] px-4 py-3 [.dark_&]:bg-[#1E1E1E]">
              <span>
                <span className="block text-[13px] font-medium text-foreground">Owed by clients</span>
                <span className="block text-[11px] text-foreground-4">{r.debts.debtors} client{r.debts.debtors === 1 ? '' : 's'} with a balance</span>
              </span>
              <span className="text-[16px] font-semibold tabular-nums text-danger">{formatKES(r.debts.outstanding)}</span>
            </Link>
          </section>

          {/* The day's sales */}
          <section>
            <SectionTitle title={`Sales on ${label.toLowerCase() === 'today' || label === 'Yesterday' ? label.toLowerCase() : label}`} right={`${r.sales.length}`} />
            <Rows
              rows={r.sales.slice(0, 12).map((s) => ({
                key: s.id,
                to: `/sales/${s.id}`,
                left: s.customer,
                sub: `${new Date(s.at).toLocaleTimeString('en-KE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })} · ${METHOD_STYLE[s.method]?.label ?? s.method}${s.status !== 'PAID' ? ` · ${s.status.toLowerCase()}` : ''}`,
                right: formatKES(s.total),
              }))}
              empty="No sales on this day."
            />
          </section>

          {/* Send it */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(summaryText(r, label))}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-[14px] font-semibold text-white active:opacity-80"
            >
              <WhatsAppIcon className="h-5 w-5" /> Share
            </a>
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#1C1F1B] text-[14px] font-semibold text-white active:opacity-80 disabled:opacity-60 [.dark_&]:bg-white [.dark_&]:text-[#1C1F1B]"
            >
              <Download className="h-4 w-4" /> {downloading ? 'Preparing…' : 'PDF report'}
            </button>
          </div>
          <p className="text-center text-[11px] text-foreground-4">
            A new report starts every day at midnight. Yesterday's is final the moment the day ends.
          </p>
        </>
      )}
    </div>
  );
}

/* ---------------- pieces ---------------- */

const TONES = {
  lavender: 'bg-[#E4E7F1] [.dark_&]:bg-[#23263A]',
  mint: 'bg-[#DDEBD9] [.dark_&]:bg-[#1D2B22]',
  sand: 'bg-[#F1E9D8] [.dark_&]:bg-[#2E281C]',
  sky: 'bg-[#DDEAF3] [.dark_&]:bg-[#1C2A33]',
} as const;

function Panel({
  tone,
  note,
  title,
  count,
  countLabel,
  more,
  children,
}: {
  tone: keyof typeof TONES;
  note: string;
  title: string;
  count: number;
  countLabel: string;
  more?: { label: string; to: string };
  children: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-[28px] p-4', TONES[tone])}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] text-foreground-4">{note}</span>
        {more && (
          <Link to={more.to} className="flex h-7 shrink-0 items-center gap-0.5 rounded-full bg-white/80 px-2.5 text-[11px] font-semibold text-foreground [.dark_&]:bg-white/10">
            {more.label}
            <ChevronDown className="h-3 w-3 -rotate-90" aria-hidden />
          </Link>
        )}
      </div>
      <div className="mb-3 mt-1 flex items-baseline justify-between gap-2">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">{title}</h2>
        <span className="text-[22px] font-semibold tabular-nums text-foreground">
          {count}
          <span className="ml-1 text-[11px] font-medium text-foreground-4">{countLabel}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">{children}</div>
    </section>
  );
}

function Tile({
  label,
  sub,
  value,
  icon: Icon,
  delta,
  invert = false,
}: {
  label: string;
  sub: string;
  value: string;
  icon: typeof Wallet;
  /** % change vs the day before; for costs, up is bad (invert). */
  delta?: number | null;
  invert?: boolean;
}) {
  const good = delta != null && (invert ? delta <= 0 : delta >= 0);
  return (
    <div className="flex min-h-[104px] flex-col justify-between rounded-2xl bg-white p-3 [.dark_&]:bg-black/30">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block text-[12px] font-medium leading-tight text-foreground-2">{label}</span>
          <span className="block truncate text-[10px] text-foreground-4">{sub}</span>
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1C1F1B] text-white [.dark_&]:bg-white [.dark_&]:text-[#1C1F1B]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      <div>
        <p className="truncate text-[18px] font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        {delta != null && (
          <p className={cn('flex items-center gap-0.5 text-[10px] font-semibold', good ? 'text-emerald-600' : 'text-red-600')}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}% vs day before
          </p>
        )}
      </div>
    </div>
  );
}

function WeekChart({
  rows,
  selected,
  today,
  onSelect,
}: {
  rows: Array<{ date: string; revenue: number }>;
  selected: string;
  today: string;
  onSelect: (date: string) => void;
}) {
  const max = Math.max(...rows.map((r) => r.revenue), 1);
  const total = useMemo(() => rows.reduce((s, r) => s + r.revenue, 0), [rows]);
  return (
    <section className="rounded-[28px] bg-[#F2F2F4] p-4 [.dark_&]:bg-[#1E1E1E]">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[11px] text-foreground-4">Revenue, last 7 days</p>
          <p className="text-[22px] font-semibold tabular-nums tracking-tight text-foreground">{formatKES(total)}</p>
        </div>
        <Wifi className="h-5 w-5 text-foreground-5" aria-hidden />
      </div>
      <div className="mt-8 flex h-36 items-end gap-2.5">
        {rows.map((r, i) => {
          const active = r.date === selected;
          const h = r.revenue > 0 ? Math.max(10, Math.round((r.revenue / max) * 112)) : 6;
          return (
            <button key={r.date} type="button" onClick={() => onSelect(r.date)} className="relative flex h-full flex-1 flex-col items-center justify-end gap-2" aria-label={`${r.date}: ${formatKES(r.revenue)}`}>
              {active && (
                <span className="absolute z-10 whitespace-nowrap rounded-full bg-[#C6EA5A] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[#1C1F1B]" style={{ bottom: h + 30 }}>
                  {formatKES(r.revenue)}
                </span>
              )}
              {active && <span className="absolute h-2 w-2 rounded-full bg-[#1C1F1B] [.dark_&]:bg-white" style={{ bottom: h + 24 }} aria-hidden />}
              <span
                className="w-full max-w-[30px] rounded-xl transition-opacity"
                style={{
                  height: h,
                  // Every bar has its own colour; the selected one is striped
                  background: active ? barStripes(i) : barColor(i).solid,
                  opacity: active ? 1 : 0.85,
                }}
              />
              <span className={cn('text-[11px] leading-none', active ? 'font-semibold text-foreground' : 'text-foreground-4')}>
                {r.date === today ? 'Today' : shortDay(r.date).weekday}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SectionTitle({ title, right, className }: { title: string; right?: string; className?: string }) {
  return (
    <div className={cn('mb-2.5 flex items-center justify-between px-1', className)}>
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
      {right && <span className="text-[12px] font-medium text-foreground-4">{right}</span>}
    </div>
  );
}

function Rows({
  rows,
  empty,
}: {
  rows: Array<{ key: string; left: string; sub?: string; right: string; to?: string }>;
  empty?: string;
}) {
  if (rows.length === 0) return <p className="px-1 text-[13px] text-foreground-4">{empty}</p>;
  return (
    <ul className="space-y-0.5">
      {rows.map((row) => {
        const body = (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">{row.left}</span>
              {row.sub && <span className="block truncate text-[11px] text-foreground-4">{row.sub}</span>}
            </span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">{row.right}</span>
          </>
        );
        return (
          <li key={row.key}>
            {row.to ? (
              <Link to={row.to} className="-mx-1 flex items-center gap-3 rounded-xl px-2 py-2.5 active:bg-surface-3">
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-1 py-2">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
