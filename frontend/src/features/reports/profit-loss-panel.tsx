import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/api/client';
import { reportsApi } from '@/api/endpoints';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatKES } from '@/lib/utils';

export function ProfitLossPanel({ from, to }: { from: string; to: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'profit-loss', { from, to }],
    queryFn: () => reportsApi.profitLoss({ from, to }),
  });

  if (error) {
    return <Alert variant="error" title="Could not load the profit report">{apiErrorMessage(error)}</Alert>;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const rows: Array<{ label: string; value: number; tone?: 'emerald' | 'red' | 'bold' }> = [
    { label: 'Sales revenue', value: data.revenue, tone: 'emerald' },
    { label: 'Cost of goods sold (stock you used)', value: -data.cogs, tone: 'red' },
    { label: 'Gross profit', value: data.grossProfit, tone: 'bold' },
    { label: 'Operating expenses (rent, salaries...)', value: -data.operatingExpenses, tone: 'red' },
    { label: 'Net profit (your actual profit)', value: data.netProfit, tone: 'bold' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase text-foreground-5">Gross margin</p>
            <p className="text-lg font-medium text-foreground">{data.grossMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium uppercase text-foreground-5">Net margin</p>
            <p className="text-lg font-medium text-foreground">{data.netMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <ul className="divide-y divide-edge">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground-2">{row.label}</span>
                <span
                  className={`text-sm font-medium ${
                    row.tone === 'emerald'
                      ? 'text-success'
                      : row.tone === 'red'
                        ? 'text-danger'
                        : 'text-foreground'
                  }`}
                >
                  {row.value < 0 ? `−${formatKES(-row.value)}` : formatKES(row.value)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3">
            <span className="text-sm font-medium text-foreground">
              Net profit {data.netProfit >= 0 ? 'made' : 'loss'}
            </span>
            <span className="text-sm font-medium text-foreground">
              {data.netProfit < 0 ? `−${formatKES(-data.netProfit)}` : formatKES(data.netProfit)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase text-foreground-5">Sales</p>
              <p className="text-base font-medium text-foreground">{data.salesCount}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-foreground-5">Average sale</p>
              <p className="text-base font-medium text-foreground">{formatKES(data.averageSaleValue)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-foreground-5">Period</p>
              <p className="text-sm font-medium text-foreground">{data.from} → {data.to}</p>
            </div>
          </div>
          {data.revenueByMethod.length > 0 && (
            <div className="mt-4 border-t border-edge pt-4">
              <p className="mb-2 text-xs font-medium uppercase text-foreground-5">
                Revenue by payment method
              </p>
              <ul className="space-y-1.5">
                {data.revenueByMethod.map((entry) => (
                  <li key={entry.method} className="flex items-center justify-between text-sm">
                    <span className="text-foreground-2">
                      {entry.method === 'M-PESA'
                        ? 'M-Pesa'
                        : entry.method.charAt(0) + entry.method.slice(1).toLowerCase()}
                    </span>
                    <span className="font-medium text-foreground">{formatKES(entry.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
