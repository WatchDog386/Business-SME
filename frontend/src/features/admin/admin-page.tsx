import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ConfirmButton,
  EmptyRow,
  PageTitle,
  PaymentLine,
  formatKES,
} from './admin-shared';

export function AdminOverviewPage() {
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: adminApi.summary,
    refetchInterval: 30_000,
  });
  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => adminApi.payments(),
    refetchInterval: 30_000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => adminApi.confirmPayment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  if (summaryQuery.error) {
    return (
      <Alert variant="error" title="Admin access required">
        {apiErrorMessage(summaryQuery.error)}
      </Alert>
    );
  }

  const summary = summaryQuery.data;
  const payments = paymentsQuery.data ?? [];
  const pending = payments.filter((p) => p.status === 'PENDING');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: activeCard * el.clientWidth, behavior: 'smooth' });
  }, [activeCard]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="Overview"
        subtitle="Everything happening across your platform at a glance."
      />

      {!summary ? (
        <div>
          <Skeleton className="h-[170px] w-full rounded-[22px]" />
        </div>
      ) : (
        <div className="space-y-3">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / el.clientWidth);
              if (idx !== activeCard && idx >= 0 && idx < 4) setActiveCard(idx);
            }}
          >
          <BankCard
            icon={<Building2 className="h-4 w-4" aria-hidden />}
            label="Businesses"
            value={String(summary.totalBusinesses)}
            hint="Registered on your platform"
            imageUrl="https://i.pinimg.com/1200x/77/71/4d/77714db652c343cfabf1c51a20e403ff.jpg"
            gradient="from-brand-700 via-brand-900 to-brand-950"
          />
          <BankCard
            icon={<TrendingUp className="h-4 w-4" aria-hidden />}
            label="Active subscriptions"
            value={String(summary.activeSubscriptions)}
            hint="Paying Growth & Scale plans"
            imageUrl="https://i.pinimg.com/736x/0a/50/bc/0a50bc5d50f5ebff9a626f1307780287.jpg"
            gradient="from-emerald-900 via-green-900 to-emerald-950"
          />
          <BankCard
            icon={<Wallet className="h-4 w-4" aria-hidden />}
            label="Collected this month"
            value={formatKES(summary.monthRevenue)}
            hint="Subscription fees received"
            imageUrl="https://i.pinimg.com/736x/56/b9/90/56b9904ab763d88bbc1fe87cb9e827b4.jpg"
            gradient="from-amber-800 via-orange-800 to-orange-950"
          />
          <BankCard
            icon={<Clock className="h-4 w-4" aria-hidden />}
            label="Awaiting confirmation"
            value={String(summary.pendingPayments)}
            hint="Bank transfers & PayPal invoices"
            imageUrl="https://i.pinimg.com/736x/0f/31/8d/0f318da21f16078d14d65da44f8628bb.jpg"
            gradient="from-black via-black to-black"
          />
          </div>
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveCard(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeCard ? 'w-5 bg-foreground' : 'w-1.5 bg-foreground/20'}`}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-3 px-1 py-2">
            <h2 className="text-[13px] font-medium tracking-tight text-foreground">Payments to confirm</h2>
            <Link
              to="/admin/payments"
              className="flex items-center gap-0.5 text-xs font-medium text-accent hover:text-accent-strong"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-edge">
            {pending.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-surface-2/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium tabular-nums text-foreground">
                    {formatKES(payment.amount)}
                    <span className="ml-1.5 font-normal text-foreground-4">
                      · {payment.method} ·{' '}
                      {payment.plan.charAt(0).toLowerCase() +
                        payment.plan.slice(1).toLowerCase()}
                    </span>
                  </p>
                  <p className="truncate text-[11px] text-foreground-5">
                    {payment.payer_email ?? payment.reference}
                  </p>
                </div>
                <ConfirmButton
                  onClick={() => confirmMutation.mutate(payment.id)}
                  busy={confirmMutation.isPending}
                />
              </div>
            ))}
          </ul>
        </section>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickLink
          to="/admin/businesses"
          icon={<Building2 className="h-4.5 w-4.5" aria-hidden />}
          label="Manage businesses"
          hint="Plans, owners & members"
          iconClass="bg-brand-700 text-white"
        />
        <QuickLink
          to="/admin/payments"
          icon={<Wallet className="h-4.5 w-4.5" aria-hidden />}
          label="Subscription fees"
          hint="Collected & pending"
          iconClass="bg-emerald-600 text-white"
        />
        <QuickLink
          to="/admin/users"
          icon={<Users className="h-4.5 w-4.5" aria-hidden />}
          label="Platform users"
          hint="Every registered account"
          iconClass="bg-amber-500 text-white"
        />
      </div>

      {/* Recent payments */}
      <section>
        <div className="flex items-center justify-between gap-3 px-1 py-2">
          <h2 className="text-[13px] font-medium tracking-tight text-foreground">Recent subscription fees</h2>
          <Link
            to="/admin/payments"
            className="flex items-center gap-0.5 text-xs font-medium text-accent hover:text-accent-strong"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <ul className="divide-y divide-edge">
          {payments.slice(0, 6).map((payment) => (
            <PaymentLine key={payment.id} payment={payment} />
          ))}
          {payments.length === 0 && (
            <EmptyRow>No subscription payments yet.</EmptyRow>
          )}
        </ul>
      </section>

      {/* Owner banner — login green */}
      <div className="flex items-center gap-3 rounded-3xl border border-brand-800 bg-brand-700 px-4 py-3 shadow-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-white" aria-hidden />
        <p className="text-xs leading-relaxed text-white">
          Signed in as the app owner — M-Pesa, Card and Bank subscription fees
          settle into your Paystack account.
        </p>
      </div>
    </div>
  );
}

/** Image pattern overshadowed by real dark colors — one at a time. */
function BankCard({
  icon,
  label,
  value,
  hint,
  imageUrl,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  imageUrl: string;
  gradient: string;
}) {
  return (
    <div
      className="relative flex h-[170px] w-full shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-5 shadow-xl"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Sleek precision — color tints pattern, image shows through */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-[0.62] ${gradient}`} aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" aria-hidden />
      <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-white/90">{label}</h3>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md border border-white/15">
          {icon}
        </span>
      </div>
      <div className="relative">
        <p className="text-3xl font-black leading-none tracking-tight tabular-nums text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {value}
        </p>
        <p className="mt-1.5 text-xs font-medium text-white/80">{hint}</p>
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
  hint,
  iconClass = 'bg-purple-600 text-white',
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  iconClass?: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl bg-surface-3 p-4 transition-colors hover:bg-surface-2 active:scale-[0.99]"
    >
      <span className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </span>
        <span>
          <span className="block text-[13px] font-medium text-foreground">
            {label}
          </span>
          <span className="block text-[11px] text-foreground-4">{hint}</span>
        </span>
      </span>
      <ChevronRight
        className="h-4 w-4 text-foreground-5 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-600"
        aria-hidden
      />
    </Link>
  );
}
