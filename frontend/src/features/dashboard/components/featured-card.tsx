import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import type { DashboardData } from '@/api/types';
import { formatKES } from '@/lib/utils';

export function FeaturedCard({ data }: { data: DashboardData }) {
  const { today } = data;
  const isProfitable = today.netProfit >= 0;
  const [hidden, setHidden] = useState(() => {
    return localStorage.getItem('biashara_hide_balance') === 'true';
  });
  const navigate = useNavigate();

  const toggleHide = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem('biashara_hide_balance', String(next));
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 shadow-xl text-white">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#00B140]">
          Today's sales summary
        </p>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {today.salesCount} sale{today.salesCount === 1 ? '' : 's'} today
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-bold text-white">Ksh</span>
            <span
              className={`font-display text-3xl sm:text-4xl font-normal tracking-tight text-white transition-all duration-200 ${
                hidden ? 'blur-md select-none opacity-80' : ''
              }`}
            >
              {formatAmount(today.sales)}
            </span>
          </div>
          <button
            onClick={toggleHide}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
          >
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="mt-2 text-sm text-zinc-300">
          Your available net profit:{' '}
          <span
            className={`font-semibold transition-all duration-200 ${
              hidden ? 'blur-sm select-none opacity-80' : ''
            } ${isProfitable ? 'text-[#01A35A]' : 'text-red-400'}`}
          >
            {formatKES(today.netProfit)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate('/sales')}
          className="rounded-xl bg-white/10 px-6 py-2.5 text-xs font-bold text-[#00B140] transition-colors hover:bg-white/20"
        >
          View sales records
        </button>
      </div>
    </div>
  );
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-KE');
}
