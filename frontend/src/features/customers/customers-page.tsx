import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users, ChevronRight } from 'lucide-react';
import { customersApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatKES } from '@/lib/utils';
import { CustomerForm } from './customer-form';

const PAGE_SIZE = 20;

export function CustomersPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') setFormOpen(true);
  }, [searchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { page, search: debouncedSearch }],
    queryFn: () =>
      customersApi.list({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Everyone who buys from you — with what they've spent and what they owe."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            window.setTimeout(() => setDebouncedSearch(event.target.value), 300);
          }}
          placeholder="Search customers by name, phone or email..."
          className="pl-9"
        />
      </div>

      {error && (
        <Alert variant="error" title="Could not load customers">
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
          icon={Users}
          title={debouncedSearch ? 'No customers found' : "You haven't added any customers yet"}
          description={
            debouncedSearch
              ? 'Try a different search term.'
              : 'Add your first customer to start tracking who buys from you.'
          }
          actionLabel={debouncedSearch ? undefined : 'Add customer'}
          onAction={() => setFormOpen(true)}
        />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <ul className="divide-y divide-edge/40">
            {data.items.map((customer) => (
              <li key={customer.id}>
                <Link
                  to={`/customers/${customer.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-text">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-foreground-5">
                      {customer.phone ?? 'No phone'} ·{' '}
                      {customer.visit_count} visit{customer.visit_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-foreground">
                      {formatKES(customer.total_spent)}
                    </p>
                    <p className="text-xs text-foreground-5">total spent</p>
                  </div>
                  {customer.outstanding_balance > 0 && (
                    <Badge variant="danger">
                      owes {formatKES(customer.outstanding_balance)}
                    </Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-foreground-5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-edge px-4 py-3">
              <p className="text-xs text-foreground-5">
                Page {page} of {totalPages} · {data.total} customers
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
