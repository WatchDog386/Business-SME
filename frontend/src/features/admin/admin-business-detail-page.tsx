import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Crown,
  Globe,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PLAN_OPTIONS = ['FREE', 'GROWTH', 'SCALE'] as const;

export function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'members' | 'activity' | 'billing'>('overview');

  const detailQuery = useQuery({
    queryKey: ['admin', 'business', id],
    queryFn: () => adminApi.businessDetail(id!),
    enabled: Boolean(id),
  });

  const setPlanMutation = useMutation({
    mutationFn: ({ plan }: { plan: 'FREE' | 'GROWTH' | 'SCALE' }) =>
      adminApi.setPlan(id!, plan),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
      void detailQuery.refetch();
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-foreground-4">Could not load business details.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/businesses')}>
          Back to businesses
        </Button>
      </div>
    );
  }

  const data = detailQuery.data;

  return (
    <div className="space-y-6 pb-6">
      <button
        onClick={() => navigate('/admin/businesses')}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground-3 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to businesses
      </button>

      {/* Hero — standalone, not floating */}
      <div className="overflow-hidden rounded-3xl border border-edge bg-surface shadow-soft">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 backdrop-blur border border-white/15">
              {data.business.logo_url ? (
                <img src={data.business.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-7 w-7 text-white/80" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight">{data.business.name}</h1>
                <select
                  value={data.business.subscription_plan}
                  onChange={(e) =>
                    setPlanMutation.mutate({ plan: e.target.value as 'FREE' | 'GROWTH' | 'SCALE' })
                  }
                  disabled={setPlanMutation.isPending}
                  className="h-7 rounded-full bg-white/15 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur outline-none"
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p} className="text-foreground">
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                  {data.business.business_type}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden />
                  Joined {new Date(data.business.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/60">
                {data.business.county && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {data.business.county}
                  </span>
                )}
                {data.business.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {data.business.phone}
                  </span>
                )}
                {data.business.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {data.business.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {data.business.currency} · {data.business.timezone}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            <MiniStat icon={<Package className="h-3.5 w-3.5" />} label="Products" value={data.stats.products} />
            <MiniStat icon={<Store className="h-3.5 w-3.5" />} label="Services" value={data.stats.services} />
            <MiniStat icon={<Users className="h-3.5 w-3.5" />} label="Customers" value={data.stats.customers} />
            <MiniStat icon={<ShoppingCart className="h-3.5 w-3.5" />} label="Sales" value={data.stats.sales} />
            <MiniStat icon={<Wallet className="h-3.5 w-3.5" />} label="Expenses" value={data.stats.expenses} />
            <MiniStat icon={<Crown className="h-3.5 w-3.5" />} label="Revenue" value={`KSh ${data.stats.totalRevenue.toLocaleString('en-KE')}`} />
          </div>
        </div>

        <div className="flex gap-1 border-b border-edge bg-surface px-2 py-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'members', label: `Members (${data.members.length})` },
            { id: 'activity', label: 'Activity' },
            { id: 'billing', label: 'Billing' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as never)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                tab === t.id ? 'bg-accent-soft text-accent' : 'text-foreground-4 hover:bg-surface-2 hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-5 p-5">
          {tab === 'overview' && (
            <>
              <DetailSection title="Business details">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <DetailRow label="Business name" value={data.business.name} />
                  <DetailRow label="Type" value={data.business.business_type} />
                  <DetailRow label="County" value={data.business.county ?? '—'} />
                  <DetailRow label="Address" value={data.business.address ?? '—'} />
                  <DetailRow label="Phone" value={data.business.phone ?? '—'} />
                  <DetailRow label="Email" value={data.business.email ?? '—'} />
                  <DetailRow label="Currency" value={data.business.currency} />
                  <DetailRow label="Timezone" value={data.business.timezone} />
                  <DetailRow label="Status" value={data.business.status} />
                  <DetailRow label="Plan" value={data.business.subscription_plan} />
                  <DetailRow label="Owner" value={data.owner?.email ?? '—'} />
                  <DetailRow label="Created" value={new Date(data.business.created_at).toLocaleString()} />
                </dl>
              </DetailSection>
              <DetailSection title="Owner">
                {data.owner ? (
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                      {(data.owner.fullName || '?').charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{data.owner.fullName}</p>
                      <p className="text-xs text-foreground-4">
                        {data.owner.email} · {data.owner.phone ?? 'no phone'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-foreground-4">No owner found.</p>
                )}
              </DetailSection>
            </>
          )}
          {tab === 'members' && (
            <DetailSection title={`Team · ${data.members.length} member${data.members.length === 1 ? '' : 's'}`}>
              <ul className="divide-y divide-edge">
                {data.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-foreground-3">
                        {(m.user?.fullName || '?').charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.user?.fullName ?? 'Unknown'}</p>
                        <p className="text-xs text-foreground-4">{m.user?.email ?? m.userId}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-4">
                      {m.role} · {m.status}
                    </span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}
          {tab === 'activity' && (
            <>
              <DetailSection title="Recent sales">
                {data.recentSales.length === 0 ? (
                  <p className="py-4 text-center text-xs text-foreground-4">No sales yet.</p>
                ) : (
                  <ul className="divide-y divide-edge">
                    {data.recentSales.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium tabular-nums text-foreground">KSh {s.total.toLocaleString('en-KE')}</p>
                          <p className="text-xs text-foreground-4">
                            {s.payment_method} · {s.payment_status} · {new Date(s.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs text-foreground-5">{s.id.slice(0, 8)}…</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSection>
              <DetailSection title="Recent customers">
                {data.recentCustomers.length === 0 ? (
                  <p className="py-4 text-center text-xs text-foreground-4">No customers yet.</p>
                ) : (
                  <ul className="divide-y divide-edge">
                    {data.recentCustomers.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-foreground-4">{c.phone ?? 'no phone'}</p>
                        </div>
                        <span className="text-xs tabular-nums text-foreground-3">KSh {c.total_spent.toLocaleString('en-KE')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailSection>
            </>
          )}
          {tab === 'billing' && (
            <DetailSection title="Subscription history">
              {data.subscriptionHistory.length === 0 ? (
                <p className="py-4 text-center text-xs text-foreground-4">No subscription payments.</p>
              ) : (
                <ul className="divide-y divide-edge">
                  {data.subscriptionHistory.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium tabular-nums text-foreground">
                          KSh {p.amount.toLocaleString('en-KE')} · {p.method} · {p.plan}
                        </p>
                        <p className="text-xs text-foreground-4">{p.reference}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          p.status === 'PAID' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning',
                        )}
                      >
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur border border-white/10">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-white/60">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-soft">
      <div className="border-b border-edge px-4 py-2.5">
        <h3 className="text-[13px] font-medium tracking-tight text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-4">{label}</p>
      <p className="mt-0.5 truncate text-sm text-foreground">{value}</p>
    </div>
  );
}
