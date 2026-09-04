import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Search, ShoppingCart, Receipt } from 'lucide-react';
import { salesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { formatKES, formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 20;

export function SalesPage() {
  const navigate = useNavigate();
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

  const statusTabs: Array<{ id: string; label: string }> = [
    { id: '', label: 'All' },
    { id: 'PAID', label: 'Paid' },
    { id: 'PARTIAL', label: 'Partial' },
    { id: 'UNPAID', label: 'Unpaid' },
  ];

  return (
    <div className="space-y-4 pb-10 font-sans text-[14px]">
      {/* Header — matches notification page */}
      <div className="relative flex h-12 items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3 active:bg-surface-3"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-tight text-foreground">
          Sales
        </h1>
        <Button onClick={() => navigate('/sales/new')} className="h-9 rounded-full px-4 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Record sale
        </Button>
      </div>

      {/* Status tabs — notification style */}
      <div className="flex items-center justify-center gap-2">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={cn(
                'h-9 w-24 rounded-full border text-xs font-medium tracking-wide transition-all active:scale-[0.97]',
                isActive ? 'border-brand-700 bg-brand-700 text-white shadow-sm' : 'border-edge bg-surface text-foreground-2 hover:bg-surface-2',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

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
          className="pl-9 h-11 rounded-full bg-field"
        />
      </div>

      {customerId && (
        <Alert variant="info">
          Showing sales for this customer.{' '}
          <button
            onClick={() => {
              setSearchParams({});
              setPage(1);
            }}
            className="font-medium underline"
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

      {isLoading && <PageLoader inline message="Loading" />}

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
        <div className="space-y-1">
          <div className="hidden sm:grid grid-cols-[1.4fr_0.9fr_1fr_0.8fr_auto] gap-2 px-1 py-2">
            <span className="text-[11px] font-medium text-foreground-4">Customer</span>
            <span className="text-[11px] font-medium text-foreground-4">Ref</span>
            <span className="text-[11px] font-medium text-foreground-4">Date &amp; method</span>
            <span className="text-right text-[11px] font-medium text-foreground-4">Total</span>
            <span className="text-right text-[11px] font-medium text-foreground-4">Status</span>
          </div>
          <ul className="divide-y divide-edge">
            {data.items.map((sale) => (
              <li key={sale.id}>
                <Link to={`/sales/${sale.id}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_0.9fr_1fr_0.8fr_auto] gap-2 px-1 py-3 transition-colors hover:bg-surface-2 active:bg-surface-3 items-center">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
                      <Receipt className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{sale.customer_name ?? 'Walk-in customer'}</p>
                      <p className="sm:hidden truncate text-xs text-foreground-5">
                        #{sale.id.slice(0, 8).toUpperCase()} · {formatKES(sale.total)}
                      </p>
                      <p className="hidden sm:block truncate text-xs text-foreground-5">
                        {sale.item_count !== undefined ? `${sale.item_count} items` : '—'}
                      </p>
                    </span>
                  </span>
                  <span className="hidden sm:block truncate text-xs font-medium tabular-nums text-foreground-3">#{sale.id.slice(0, 8).toUpperCase()}</span>
                  <span className="hidden sm:block min-w-0">
                    <p className="truncate text-xs text-foreground-3">{formatDateTime(sale.created_at)}</p>
                    <p className="truncate text-[11px] text-foreground-5">{sale.payment_method}</p>
                  </span>
                  <span className="hidden sm:block text-right text-sm font-medium tabular-nums text-foreground">{formatKES(sale.total)}</span>
                  <span className="text-right">
                    <Badge variant={statusVariant(sale.payment_status)}>{statusLabel(sale.payment_status)}</Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-1 py-3">
              <p className="text-xs text-foreground-5">Page {page} of {totalPages} · {data.total} sales</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
