import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Receipt, ChevronRight } from 'lucide-react';
import type { DashboardData } from '@/api/types';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatKES, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const filters = [
  { key: 'ALL', label: 'All Transactions' },
  { key: 'SALE', label: 'Sales' },
  { key: 'EXPENSE', label: 'Expenses' },
] as const;

export function RecentTransactions({
  transactions,
}: {
  transactions: DashboardData['recentTransactions'];
}) {
  const [filter, setFilter] = useState<'ALL' | 'SALE' | 'EXPENSE'>('ALL');
  const visible =
    filter === 'ALL'
      ? transactions
      : transactions.filter((t) => t.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">Recent transactions</h2>
          <p className="text-xs text-foreground-4">Latest financial activity across your business</p>
        </div>
        <Link
          to="/sales"
          className="flex items-center gap-1 text-xs font-bold text-accent transition-colors hover:text-accent-strong"
        >
          <span>See All</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold border transition-all',
              filter === f.key
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-surface text-foreground-3 border-edge hover:border-accent-border hover:bg-surface-2',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Record your first sale or expense to see it here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((transaction) => {
            const isSale = transaction.type === 'SALE';
            return (
              <Link
                key={`${transaction.type}-${transaction.id}`}
                to={isSale ? `/sales/${transaction.id}` : '/expenses'}
                className="group relative flex items-center justify-between gap-4 rounded-3xl border border-[#2A2A2A] bg-[#1E1E1E] p-4.5 shadow-lg transition-all hover:border-[#00B140]/50 hover:shadow-xl text-white"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-105',
                      isSale
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                    )}
                  >
                    {isSale ? (
                      <ArrowUpRight className="h-6 w-6" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-6 w-6" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                      {transaction.description}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-medium text-zinc-300">
                        {transaction.customerName ?? 'Walk-in'}
                      </span>
                      <span>·</span>
                      <span>{formatTime(transaction.createdAt)}</span>
                      <span>·</span>
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {transaction.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={cn('text-sm font-extrabold tracking-tight', isSale ? 'text-emerald-400' : 'text-red-400')}>
                    {isSale ? '+' : '-'}
                    {formatKES(transaction.amount)}
                  </p>
                  <div className="mt-1">
                    <Badge variant={statusVariant(transaction.status)}>
                      {statusLabel(transaction.status)}
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
