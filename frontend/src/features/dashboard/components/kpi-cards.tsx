import type { DashboardData } from '@/api/types';
import { formatKES } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function KpiCards({ data }: { data: DashboardData }) {
  const { today } = data;
  const isProfitable = today.netProfit >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="flex flex-col justify-between rounded-2xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 shadow-sm text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Expenses
          </p>
          <p className="mt-2 font-display text-2xl font-normal tracking-tight text-white">
            {formatKES(today.expenses)}
          </p>
        </div>
        <p className="mt-3 text-xs text-zinc-400">Operating costs today</p>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 shadow-sm text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Profit
          </p>
          <p
            className={cn(
              'mt-2 font-display text-2xl font-normal tracking-tight',
              isProfitable ? 'text-[#01A35A]' : 'text-red-400',
            )}
          >
            {formatKES(today.netProfit)}
          </p>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Gross {formatKES(today.grossProfit)}
        </p>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 shadow-sm text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Debtors
          </p>
          <p className="mt-2 font-display text-2xl font-normal tracking-tight text-white">
            {formatKES(data.outstandingDebts)}
          </p>
        </div>
        <p className="mt-3 text-xs text-zinc-400">Balances due</p>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-[#2A2A2A] bg-[#1E1E1E] p-4 shadow-sm text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Sales count
          </p>
          <p className="mt-2 font-display text-2xl font-normal tracking-tight text-white">
            {today.salesCount}
          </p>
        </div>
        <p className="mt-3 text-xs text-zinc-400">Transactions made</p>
      </div>
    </div>
  );
}
