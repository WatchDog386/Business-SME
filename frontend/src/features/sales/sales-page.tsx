import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowUpDown, Search, ShoppingCart, Receipt } from 'lucide-react';
import { dashboardApi, salesApi } from '@/api/endpoints';
import { Chips } from '@/components/layout/app-bar';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { invoiceNo } from '@/features/isp/document-actions';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { cn, formatKES, formatDateTime } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { DesktopSalesPage } from './desktop-sales-page';

const PAGE_SIZE = 20;

function shortKsh(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString('en-KE', { maximumFractionDigits: 1 })}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toLocaleString('en-KE', { maximumFractionDigits: 1 })}K`;
  return amount.toLocaleString('en-KE');
}

/** Desktop gets its own table view; phones keep the card layout. Separate components so each keeps its own hooks. */
export function SalesPage() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <DesktopSalesPage /> : <SalesMobilePage />;
}

function SalesMobilePage() {
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

  // Business-wide figures for the tiles (shared with the dashboard's cache)
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  const [newestFirst, setNewestFirst] = useState(true);
  const items = data ? (newestFirst ? data.items : [...data.items].reverse()) : [];

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const statusTabs: Array<{ id: string; label: string }> = [
    { id: '', label: 'All' },
    { id: 'PAID', label: 'Paid' },
    { id: 'PARTIAL', label: 'Partial' },
    { id: 'UNPAID', label: 'Unpaid' },
  ];

  return (
    <div className="space-y-4 pb-10 font-sans text-[14px]">
      {/* Header, same as the Products page: greeting with avatar and back */}
      <header className="page-head flex items-center justify-between gap-3 text-foreground">
        <h1 className="text-[24px] leading-tight tracking-tight">
          Let&apos;s track
          <span className="block font-semibold">Your Sales! 🛒</span>
        </h1>
        <div className="flex shrink-0 items-center">
  <button
    type="button"
    onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard'))}
    className="-ml-3 flex h-12 w-12 items-center justify-center text-foreground-2 active:scale-90 active:opacity-60"
    aria-label="Back"
  >
    Back
  </button>
</div>
      </header>

      <Chips
        outline
        items={statusTabs}
        value={statusFilter}
        onChange={(id) => {
          setStatusFilter(id);
          setPage(1);
        }}
      />

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              window.setTimeout(() => setDebouncedSearch(event.target.value), 300);
            }}
            placeholder="Search sales by customer or reference..."
            className="h-11 rounded-full bg-field pl-9"
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          onClick={() => setNewestFirst((v) => !v)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-foreground active:scale-90"
          aria-label={newestFirst ? 'Show oldest first' : 'Show newest first'}
          title="Sort by date"
        >
          <ArrowUpDown className={cn('h-4 w-4 transition-transform', !newestFirst && 'rotate-180')} />
        </button>
      </div>

      {/* Three equal tiles, like Products */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'Today',
            value: dashboard.data ? shortKsh(dashboard.data.today.cashReceived) : '—',
            bg: 'bg-emerald-50 [.dark_&]:bg-surface',
            text: 'text-emerald-700 [.dark_&]:text-emerald-400',
          },
          {
            label: 'Sales',
            value: data ? String(data.total) : '—',
            bg: 'bg-blue-50 [.dark_&]:bg-surface',
            text: 'text-blue-700 [.dark_&]:text-blue-400',
          },
          {
            label: 'Owed',
            value: dashboard.data ? shortKsh(dashboard.data.outstandingDebts) : '—',
            bg: 'bg-red-50 [.dark_&]:bg-surface',
            text: 'text-red-700 [.dark_&]:text-red-400',
          },
        ].map((tile) => (
          <div key={tile.label} className={cn('flex h-[68px] flex-col items-center justify-center rounded-[22px] px-2', tile.bg)}>
            <span className={cn('text-[11px] font-medium leading-4', tile.text)}>{tile.label}</span>
            <span className={cn('mt-1 h-5 text-[14px] font-semibold leading-5 tabular-nums', tile.text)}>{tile.value}</span>
          </div>
        ))}
      </div>

      <motion.button
        type="button"
        onClick={() => navigate('/sales/new')}
        whileTap={{ scale: 0.98 }}
        className="flex h-11 w-full items-center justify-center rounded-full border-2 border-edge-2 text-[15px] font-semibold text-brand-600 [.dark_&]:text-brand-400"
      >
        Record sale
      </motion.button>

      {customerId && (
        <Alert variant="info" inline>
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
        <Alert variant="error" title="Could not load sales" inline>
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
          <ul className="stagger-list divide-y divide-edge max-lg:divide-y-0">
            {items.map((sale) => (
              <li key={sale.id}>
                <Link to={`/sales/${sale.id}`} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_0.9fr_1fr_0.8fr_auto] gap-2 px-1 py-3 transition-colors hover:bg-surface-2 active:bg-surface-3 items-center">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent">
                      <Receipt className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{sale.customer_name ?? 'Walk-in customer'}</p>
                      <p className="truncate text-[11px] text-foreground-5">{saleCategoryLabel(sale.sale_type)}</p>
                      <p className="sm:hidden truncate text-xs text-foreground-5">
                        {sale.number ? invoiceNo(sale.number) : `#${sale.id.slice(0, 8).toUpperCase()}`} · {formatKES(sale.total)}
                      </p>
                      <p className="hidden sm:block truncate text-xs text-foreground-5">
                        {sale.item_count !== undefined ? `${sale.item_count} items` : '—'}
                      </p>
                    </span>
                  </span>
                  <span className="hidden sm:block truncate text-xs font-medium tabular-nums text-foreground-3">{sale.number ? invoiceNo(sale.number) : `#${sale.id.slice(0, 8).toUpperCase()}`}</span>
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

function saleCategoryLabel(type?: string) {
  const labels: Record<string, string> = {
    GENERAL: "Today's general sales",
    PRODUCT: 'Product sale',
    SERVICE: 'Service sale',
    PACKAGE: 'Package subscription',
    ADVANCE: 'Advance payment',
    OTHER: 'Other revenue',
    MIXED: 'Mixed sale',
  };
  return labels[type ?? 'PRODUCT'] ?? 'Product sale';
}
