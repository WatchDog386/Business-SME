import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Banknote, LayoutGrid, Plus, Search, Users, Wallet, ChevronRight } from 'lucide-react';
import { customersApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatKES } from '@/lib/utils';
import { PageLoader } from '@/components/ui/spinner';
import { CustomerForm } from './customer-form';

const PAGE_SIZE = 20;

export function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debtors' | 'creditors'>('all');

  useEffect(() => {
    if (searchParams.get('new') === '1') setFormOpen(true);
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { page, search: debouncedSearch }],
    queryFn: () =>
      customersApi.list({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const avatarTints = [
    'bg-accent-soft text-accent',
    'bg-success-soft text-success',
    'bg-warning-soft text-warning',
    'bg-info-soft text-info',
    'bg-purple-500/10 text-purple-600',
    'bg-rose-500/10 text-rose-600',
    'bg-cyan-500/10 text-cyan-600',
    'bg-amber-500/10 text-amber-600',
  ] as const;

  function getAvatarTint(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return avatarTints[Math.abs(hash) % avatarTints.length];
  }

  const filterTabs: Array<{ id: typeof filter; label: string; icon: typeof LayoutGrid; iconColor: string }> = [
    { id: 'all', label: 'All', icon: LayoutGrid, iconColor: 'text-brand-600' },
    { id: 'debtors', label: 'Debtors', icon: Wallet, iconColor: 'text-red-600' },
    { id: 'creditors', label: 'Creditors', icon: Banknote, iconColor: 'text-emerald-600' },
  ];

  const filteredItems = (data?.items ?? []).filter((c) => {
    if (filter === 'debtors') return c.outstanding_balance > 0;
    if (filter === 'creditors') return c.outstanding_balance < 0;
    return true;
  });

  return (
    <div className="space-y-4 pb-10">
      <div className="relative flex h-12 items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-tight text-foreground">Customers</h1>
        <Button onClick={() => setFormOpen(true)} className="rounded-full bg-accent text-white hover:bg-accent-strong h-9 px-4 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            window.setTimeout(() => setDebouncedSearch(event.target.value), 300);
          }}
          placeholder="Search customers by name, phone or email..."
          className="pl-9 h-11 rounded-full bg-field"
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'flex h-9 w-24 items-center justify-center gap-1.5 rounded-full border text-xs font-medium tracking-wide transition-all active:scale-[0.97]',
                isActive ? 'border-brand-700 bg-brand-700 text-white shadow-sm' : 'border-edge bg-surface text-foreground-2 hover:bg-surface-2',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-white' : tab.iconColor)} aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <Alert variant="error" title="Could not load customers">
          {apiErrorMessage(error)}
        </Alert>
      )}

      {isLoading && <PageLoader inline message="Loading" />}

      {data && filteredItems.length === 0 && (
        <EmptyState
          icon={Users}
          title={debouncedSearch || filter !== 'all' ? 'No customers found' : "You haven't added any customers yet"}
          description={
            debouncedSearch || filter !== 'all'
              ? 'Try a different search or filter.'
              : 'Add your first customer to start tracking who buys from you.'
          }
          actionLabel={debouncedSearch || filter !== 'all' ? undefined : 'Add customer'}
          onAction={() => setFormOpen(true)}
        />
      )}

      {data && filteredItems.length > 0 && (
        <div className="space-y-1">
          <ul className="divide-y divide-edge">
            {filteredItems.map((customer) => (
              <li key={customer.id}>
                <Link
                  to={`/customers/${customer.id}`}
                  className="flex items-center gap-3 px-1 py-2.5 transition-colors hover:bg-surface-2 active:bg-surface-3"
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium', getAvatarTint(customer.name))}>
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
                    <p className="truncate text-xs text-foreground-5">
                      {customer.phone ?? 'No phone'} · {customer.visit_count} visit{customer.visit_count === 1 ? '' : 's'}
                    </p>
                  </span>
                  {filter !== 'all' && customer.outstanding_balance !== 0 && (
                    <Badge variant={customer.outstanding_balance > 0 ? 'danger' : 'success'} className="shrink-0">
                      {customer.outstanding_balance > 0 ? `owes ${formatKES(customer.outstanding_balance)}` : `credit ${formatKES(Math.abs(customer.outstanding_balance))}`}
                    </Badge>
                  )}
                  <span className="hidden text-right sm:block ml-auto">
                    <p className="text-sm font-medium tabular-nums text-foreground">{customer.visit_count} visits</p>
                    <p className="text-right text-xs text-foreground-5">{customer.visit_count > 5 ? 'loyal' : customer.visit_count > 2 ? 'regular' : 'new'}</p>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-foreground-5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between px-1 py-3">
              <p className="text-xs text-foreground-5">Page {page} of {totalPages} · {data.total} customers</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Add a customer"
        description="Add someone who buys from your business."
      >
        <CustomerForm onClose={() => setFormOpen(false)} />
      </Dialog>
    </div>
  );
}
