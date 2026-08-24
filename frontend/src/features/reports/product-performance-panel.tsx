import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/api/client';
import { reportsApi } from '@/api/endpoints';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Package } from 'lucide-react';
import { formatKES } from '@/lib/utils';

export function ProductPerformancePanel({ from, to }: { from: string; to: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'products', { from, to }],
    queryFn: () => reportsApi.productPerformance({ from, to }),
  });

  if (error) {
    return <Alert variant="error" title="Could not load product performance">{apiErrorMessage(error)}</Alert>;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No product sales in this period"
        description="Try a wider date range."
      />
    );
  }

  const sorted = [...data].sort((a, b) => b.profit - a.profit);

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs font-medium uppercase text-foreground-5">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Sold</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {sorted.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-3 text-right text-foreground-2">{row.quantity}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{formatKES(row.revenue)}</td>
                <td className={`px-4 py-3 text-right font-medium ${row.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {row.profit < 0 ? `−${formatKES(-row.profit)}` : formatKES(row.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
