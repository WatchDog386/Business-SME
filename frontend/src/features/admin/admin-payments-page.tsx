import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  ConfirmButton,
  EmptyRow,
  PageTitle,
  PaymentLine,
  SectionCard,
  formatKES,
} from './admin-shared';

const FILTERS = ['ALL', 'PENDING', 'PAID'] as const;

export function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');

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

  const payments = paymentsQuery.data ?? [];
  const shown =
    filter === 'ALL' ? payments : payments.filter((p) => p.status === filter);
  const lifetime = payments
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <PageTitle
        title="Subscription fees"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-surface-2 p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                filter === f
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-foreground-4 hover:text-foreground',
              )}
            >
              {f === 'ALL'
                ? 'All'
                : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground-4">
          Lifetime collected:{' '}
          <strong className="font-medium tabular-nums text-foreground">
            {formatKES(lifetime)}
          </strong>
        </p>
      </div>

      {paymentsQuery.isLoading ? (
        <PageLoader inline message="Loading" />
      ) : (
        <SectionCard>
          <ul className="divide-y divide-edge">
            {shown.map((payment) =>
              payment.status === 'PENDING' ? (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60"
                >
                  <PaymentLine payment={payment} action={null} />
                  <ConfirmButton
                    onClick={() => confirmMutation.mutate(payment.id)}
                    busy={confirmMutation.isPending}
                  />
                </div>
              ) : (
                <PaymentLine key={payment.id} payment={payment} />
              ),
            )}
            {shown.length === 0 && (
              <EmptyRow>No {filter.toLowerCase()} payments.</EmptyRow>
            )}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
