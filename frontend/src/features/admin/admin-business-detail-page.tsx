import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Clock,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { PageLoader } from '@/components/ui/spinner';
import {
  PaymentLine,
  formatKES,
} from './admin-shared';

const HERO_PLAN_PILL: Record<string, string> = {
  FREE: 'border border-white/15 bg-white/15 text-white/85 backdrop-blur',
  GROWTH: 'bg-emerald-500 text-white',
  SCALE: 'bg-brand-600 text-white',
};

function GradientStat({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div
      className={`relative flex h-[104px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-3.5 shadow-lg ${gradient}`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" aria-hidden />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/80">{label}</p>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/15 text-white backdrop-blur">
          {icon}
        </span>
      </div>
      <p className="relative text-2xl font-black leading-none tracking-tight tabular-nums text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.55)]">
        {value}
      </p>
    </div>
  );
}

export function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'business', id],
    queryFn: () => adminApi.businessDetail(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <PageLoader inline message="Loading" />;
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-foreground-4">Could not load this business.</p>
        <Link
          to="/admin/businesses"
          className="mt-3 inline-block text-xs font-medium text-accent hover:text-accent-strong"
        >
          Back to businesses
        </Link>
      </div>
    );
  }

  const { business, stats, members, recentSales, subscriptionHistory } = data;
  const joinedDate = new Date(business.created_at).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 pb-4">
      <Link
        to="/admin/businesses"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-4 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Businesses
      </Link>

      {/* Identity hero — gradient like overview bank cards */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" aria-hidden />
        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-accent/25 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md">
            {business.logo_url ? (
              <img src={business.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-white/90" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                {business.name}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${HERO_PLAN_PILL[business.subscription_plan] ?? HERO_PLAN_PILL.FREE}`}
              >
                {business.subscription_plan}
              </span>
              <span className="shrink-0 rounded-full border border-white/15 bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur">
                {business.business_type}
              </span>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-white/70">
              {business.county && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {business.county}
                </span>
              )}
              {business.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" aria-hidden />
                  {business.phone}
                </span>
              )}
              {business.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" aria-hidden />
                  {business.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                Joined {joinedDate}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats — deep-gradient mini cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GradientStat
          icon={<Package className="h-3.5 w-3.5" aria-hidden />}
          label="Products"
          value={String(stats.products)}
          gradient="from-brand-700 via-brand-900 to-brand-950"
        />
        <GradientStat
          icon={<Store className="h-3.5 w-3.5" aria-hidden />}
          label="Services"
          value={String(stats.services)}
          gradient="from-purple-900 via-purple-950 to-fuchsia-950"
        />
        <GradientStat
          icon={<Users className="h-3.5 w-3.5" aria-hidden />}
          label="Customers"
          value={String(stats.customers)}
          gradient="from-amber-700 via-orange-800 to-orange-950"
        />
        <GradientStat
          icon={<ShoppingCart className="h-3.5 w-3.5" aria-hidden />}
          label="Sales"
          value={String(stats.sales)}
          gradient="from-emerald-800 via-green-900 to-emerald-950"
        />
      </div>

      {/* Financials — flat on background like overview */}
      <section>
        <div className="px-1 py-2">
          <h2 className="text-[13px] font-medium tracking-tight text-foreground">Financials</h2>
        </div>
        <ul className="divide-y divide-edge">
          <FinRow
            label="Total revenue"
            value={formatKES(stats.totalRevenue)}
            accent
          />
          <FinRow label="Total expenses" value={formatKES(stats.totalExpenses)} />
          <FinRow
            label="Net position"
            value={formatKES(stats.totalRevenue - stats.totalExpenses)}
            muted={stats.totalRevenue - stats.totalExpenses < 0}
          />
        </ul>
      </section>

      {/* Team — flat on background */}
      <section>
        <div className="flex items-center justify-between gap-3 px-1 py-2">
          <h2 className="text-[13px] font-medium tracking-tight text-foreground">
            Team
          </h2>
          <span className="text-[11px] font-medium text-foreground-4">
            {members.length} member{members.length === 1 ? '' : 's'}
          </span>
        </div>
        <ul className="divide-y divide-edge">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-surface-2/60"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold uppercase text-foreground-3">
                  {(m.user?.fullName ?? m.user?.email ?? '?').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {m.user?.fullName ?? 'Unknown user'}
                  </p>
                  <p className="truncate text-[11px] text-foreground-5">
                    {m.user?.email ?? m.userId}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-4">
                {m.role}
              </span>
            </li>
          ))}
          {members.length === 0 && (
            <li className="px-1 py-8 text-center text-xs text-foreground-4">No team members.</li>
          )}
        </ul>
      </section>

      {/* Recent sales — flat on background */}
      <section>
        <div className="px-1 py-2">
          <h2 className="text-[13px] font-medium tracking-tight text-foreground">Recent sales</h2>
        </div>
        <ul className="divide-y divide-edge">
          {recentSales.slice(0, 6).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-surface-2/60"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium tabular-nums text-foreground">
                  {formatKES(s.total)}
                </p>
                <p className="truncate text-[11px] text-foreground-5">
                  {s.payment_method} ·{' '}
                  {new Date(s.created_at).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <Receipt className="h-3.5 w-3.5 shrink-0 text-foreground-5" aria-hidden />
            </li>
          ))}
          {recentSales.length === 0 && (
            <li className="px-1 py-8 text-center text-xs text-foreground-4">
              No sales recorded yet.
            </li>
          )}
        </ul>
      </section>

      {/* Billing — flat on background */}
      <section>
        <div className="px-1 py-2">
          <h2 className="text-[13px] font-medium tracking-tight text-foreground">
            Subscription payments
          </h2>
        </div>
        <ul className="divide-y divide-edge">
          {subscriptionHistory.slice(0, 6).map((p) => (
            <PaymentLine key={p.id} payment={p} />
          ))}
          {subscriptionHistory.length === 0 && (
            <li className="px-1 py-8 text-center text-xs text-foreground-4">
              No subscription payments yet.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function FinRow({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-surface-2/60">
      <span className="flex items-center gap-2.5 text-[13px] text-foreground-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            accent ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-foreground-3'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        </span>
        {label}
      </span>
      <span
        className={`shrink-0 text-[13px] font-medium tracking-tight tabular-nums ${
          muted ? 'text-danger' : accent ? 'text-accent' : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </li>
  );
}
