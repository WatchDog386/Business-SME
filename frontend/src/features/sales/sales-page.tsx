import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, ShoppingCart, Receipt } from 'lucide-react';
import { salesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatKES, formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 20;

const statusOptions = ['PAID', 'PARTIAL', 'UNPAID', 'REFUNDED', 'CANCELLED'];

export function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get('customer') ?? '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'sales',
      {
        page,
        search: debouncedSearch,
        paymentStatus: statusFilter,
        customerId,
      },
    ],
    queryFn: () =>
      salesApi.list({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        paymentStatus: statusFilter || undefined,
        customerId: customerId || undefined,
      }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales"
        description="Every sale you've recorded, with payment status."
        actions={
          <Button onClick={() => window.location.assign('/sales/new')}>
            <Plus className="h-4 w-4" />
            Record sale
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              window.setTimeout(() => setDebouncedSearch(event.target.value), 300);
            }}
            placeholder="Search sales by customer or reference..."
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          placeholder="All payment statuses"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </Select>
      </div>

      {customerId && (
        <Alert variant="info">
          Showing sales for this customer.{' '}
          <button
            onClick={() => {
              setSearchParams({});
              setPage(1);
            }}
            className="font-bold underline"
          >
            Clear filter
          </button>
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Could not load sales">
          {apiErrorMessage(error)}
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={ShoppingCart}
          title={debouncedSearch ? 'No sales found' : 'No sales yet'}
          description={
            debouncedSearch
              ? 'Try a different search.'
              : 'Record your first sale — it takes under 10 seconds.'
          }
          actionLabel={debouncedSearch ? undefined : 'Record a sale'}
          onAction={() => window.location.assign('/sales/new')}
        />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <ul className="divide-y divide-edge">
            {data.items.map((sale) => (
              <li key={sale.id}>
                <Link
                  to={`/sales/${sale.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Receipt className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {sale.customer_name ?? 'Walk-in customer'}
                    </p>
                    <p className="truncate text-xs text-foreground-5">
                      #{sale.id.slice(0, 8).toUpperCase()} · {formatDateTime(sale.created_at)} ·{' '}
                      {sale.payment_method}
                      {sale.item_count !== undefined && ` · ${sale.item_count} item${sale.item_count === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {formatKES(sale.total)}
                    </p>
                    <Badge variant={statusVariant(sale.payment_status)}>
                      {statusLabel(sale.payment_status)}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-edge px-4 py-3">
              <p className="text-xs text-foreground-5">
                Page {page} of {totalPages} · {data.total} sales
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
