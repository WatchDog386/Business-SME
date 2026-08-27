import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Search,
  Store,
  Users,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '@/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PageTitle } from './admin-shared';

const PLAN_OPTIONS = ['FREE', 'GROWTH', 'SCALE'] as const;

export function AdminBusinessesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  const businessesQuery = useQuery({
    queryKey: ['admin', 'businesses'],
    queryFn: adminApi.businesses,
  });

  const businesses = businessesQuery.data ?? [];
  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      businesses.filter((b) => {
        const matchesSearch =
          !q ||
          b.name.toLowerCase().includes(q) ||
          (b.owner_email ?? '').toLowerCase().includes(q) ||
          b.business_type.toLowerCase().includes(q);
        const matchesPlan = planFilter === 'ALL' || b.subscription_plan === planFilter;
        return matchesSearch && matchesPlan;
      }),
    [businesses, q, planFilter],
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Businesses"
        subtitle={`${filtered.length} of ${businesses.length} businesses — tap any row for the full dossier.`}
      />

      {/* Sleek toolbar — not a card grid */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-10 flex-1 items-center gap-2.5 rounded-full border border-edge bg-field px-4 focus-within:border-edge-2">
          <Search className="h-4 w-4 shrink-0 text-foreground-4" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business, owner or type…"
            className="h-full w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-foreground-5"
          />
        </div>
        <div className="flex gap-1.5">
          {(['ALL', ...PLAN_OPTIONS] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setPlanFilter(plan)}
              className={cn(
                'rounded-full px-3.5 py-2 text-xs font-medium transition-colors',
                planFilter === plan
                  ? 'bg-foreground text-white shadow-sm'
                  : 'bg-surface-2 text-foreground-3 hover:bg-surface-3 hover:text-foreground',
              )}
            >
              {plan === 'ALL' ? 'All plans' : plan}
            </button>
          ))}
        </div>
      </div>

      {businessesQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge bg-surface-3 px-6 py-12 text-center">
          <p className="text-sm text-foreground-4">No businesses match your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-soft">
          {/* Table header */}
          <div className="hidden grid-cols-[1.6fr_1.2fr_0.7fr_0.6fr] gap-4 border-b border-edge bg-surface-2 px-4 py-2.5 sm:grid">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-4">Business</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-4">Owner</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-4">Plan</span>
            <span className="text-right text-[10px] font-semibold uppercase tracking-wider text-foreground-4">Joined</span>
          </div>

          <ul className="divide-y divide-edge">
            {filtered.map((b) => (
              <li
                key={b.id}
                onClick={() => navigate(`/admin/businesses/${b.id}`)}
                className="group flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2 active:bg-surface-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Store className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground">{b.name}</p>
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-foreground-5">
                      <span className="rounded bg-surface-2 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                        {b.business_type}
                      </span>
                      {b.county && (
                        <>
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                          {b.county}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 sm:block">
                  <p className="truncate text-[13px] text-foreground-2">{b.owner_email ?? '—'}</p>
                  <p className="flex items-center gap-1 truncate text-[11px] text-foreground-5">
                    <Users className="h-3 w-3" aria-hidden />
                    {b.member_count} member{b.member_count === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="hidden shrink-0 sm:block">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                      b.subscription_plan === 'FREE'
                        ? 'bg-surface-2 text-foreground-4'
                        : b.subscription_plan === 'GROWTH'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-brand-600 text-white',
                    )}
                  >
                    {b.subscription_plan}
                  </span>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-xs tabular-nums text-foreground-3">
                    {new Date(b.created_at).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-foreground-5 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

