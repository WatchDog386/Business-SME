import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/api/client';
import { reportsApi } from '@/api/endpoints';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3 } from 'lucide-react';
import { formatKES } from '@/lib/utils';

export function DailySummaryPanel({ from, to }: { from: string; to: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'daily-summary', { from, to }],
    queryFn: () => reportsApi.dailySummary({ from, to }),
  });

  if (error) {
    return <Alert variant="error" title="Could not load the daily summary">{apiErrorMessage(error)}</Alert>;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No sales in this period"
        description="Try a wider date range."
      />
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs font-medium uppercase text-foreground-5">
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">COGS</th>
              <th className="px-4 py-3 text-right">Expenses</th>
              <th className="px-4 py-3 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {data.map((row) => (
              <tr key={row.date}>
                <td className="px-4 py-3 font-medium text-foreground">{row.date}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{formatKES(row.revenue)}</td>
                <td className="px-4 py-3 text-right text-danger">−{formatKES(row.cogs)}</td>
                <td className="px-4 py-3 text-right text-danger">−{formatKES(row.expenses)}</td>
                <td className={`px-4 py-3 text-right font-medium ${row.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {row.netProfit < 0 ? `−${formatKES(-row.netProfit)}` : formatKES(row.netProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
