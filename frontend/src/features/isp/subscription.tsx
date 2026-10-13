import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CARD_THEMES, CardPatternLayer } from '@/components/brand/fiber-card';
import { motion } from 'framer-motion';
import { RefreshCw, Wifi } from 'lucide-react';
import { callsApi, subscriptionsApi } from '@/api/endpoints';
import type { SubscriptionStatus } from '@/api/types';
import { cn, formatDate, formatKES } from '@/lib/utils';
import { outcomeInfo } from './contact';

export const STATUS_STYLE: Record<SubscriptionStatus, { label: string; pill: string; bar: string }> = {
  ACTIVE: { label: 'Active', pill: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  EXPIRING: { label: 'Expiring soon', pill: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  EXPIRED: { label: 'Expired', pill: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
};

export function StatusPill({ status }: { status: SubscriptionStatus }) {
  const s = STATUS_STYLE[status];
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold', s.pill)}>{s.label}</span>;
}

export function daysText(daysLeft: number): string {
  if (daysLeft > 1) return `${daysLeft} days left`;
  if (daysLeft === 1) return '1 day left';
  if (daysLeft === 0) return 'Expires today';
  return `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago`;
}

/** A client's WiFi package with status and a one-tap renew. */
export function SubscriptionCard({ customerId }: { customerId: string }) {
  const navigate = useNavigate();
  const uid = useId().replace(/:/g, '');
  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription', customerId],
    queryFn: () => subscriptionsApi.forCustomer(customerId),
  });
  if (isLoading) return <div className="h-36 animate-pulse rounded-3xl bg-surface-3" />;

  if (!sub) {
    return (
      <section className="flex items-center gap-3 px-1 py-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-3 text-foreground-4">
          <Wifi className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-foreground">No WiFi package yet</p>
          <p className="text-[12px] text-foreground-4">Sell a package to connect this client.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/sales/new?customer=${customerId}`)}
          className="h-9 shrink-0 rounded-full bg-brand-600 px-4 text-[12px] font-semibold text-white active:scale-95"
        >
          Connect
        </button>
      </section>
    );
  }

  const style = STATUS_STYLE[sub.status];
  // Share of a 30-day period remaining, for the bar
  const pct = Math.max(0, Math.min(100, (sub.daysLeft / 30) * 100));

  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#136B47_0%,#0B4A33_55%,#063524_100%)] p-5 text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <CardPatternLayer theme={CARD_THEMES.network} w={400} h={260} uid={uid} />
      </svg>
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-white/70">WiFi package</p>
          <p className="mt-0.5 truncate text-[18px] font-semibold leading-tight">{sub.packageName}</p>
          <p className="mt-1 text-[13px] text-white/75">
            {sub.speedMbps ? `${sub.speedMbps} Mbps · ` : ''}
            {formatKES(sub.price)}/month
          </p>
        </div>
        <StatusPill status={sub.status} />
      </div>

      <div className="relative mt-5">
        <div className="flex items-baseline justify-between text-[12px]">
          <span className="font-semibold">{daysText(sub.daysLeft)}</span>
          <span className="text-white/70">{sub.status === 'EXPIRED' ? 'Ended' : 'Until'} {formatDate(sub.expiresAt)}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className={cn('h-full rounded-full', style.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate(`/sales/new?customer=${customerId}&product=${sub.productId}`)}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 text-[14px] font-medium text-white backdrop-blur-sm active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Renew
        </button>
        <button
          type="button"
          onClick={() => navigate(`/sales?customer=${customerId}`)}
          className="flex h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 text-[14px] font-medium text-white backdrop-blur-sm active:scale-[0.98]"
        >
          Sales
        </button>
      </div>
    </section>
  );
}

/** Latest calls with a client, newest first. */
export function CallHistory({ customerId }: { customerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['calls', customerId],
    queryFn: () => callsApi.history(customerId),
  });
  if (isLoading) return <div className="h-20 animate-pulse rounded-2xl bg-surface-3" />;
  if (!data?.length) return <p className="px-1 text-[13px] text-foreground-4">No calls logged yet.</p>;
  return (
    <ul className="divide-y divide-edge max-lg:divide-y-0">
      {data.slice(0, 8).map((c) => {
        const info = outcomeInfo(c.outcome);
        return (
          <li key={c.id} className="px-1 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', info.tone)}>{info.label}</span>
              <span className="text-[11px] text-foreground-4">
                {new Date(c.calledAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {c.calledBy}
              </span>
            </div>
            {c.notes && <p className="mt-1.5 text-[13px] text-foreground-2">{c.notes}</p>}
            {c.followUpAt && !c.followUpDone && (
              <p className="mt-1 text-[12px] font-medium text-violet-600">
                Call back {new Date(c.followUpAt).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
