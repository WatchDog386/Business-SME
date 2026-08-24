import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Wallet } from 'lucide-react';
import { categoriesApi, expensesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatKES, formatDate } from '@/lib/utils';
import { ExpenseForm } from './expense-form';
import type { Expense } from '@/api/types';

const PAGE_SIZE = 20;

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') setFormOpen(true);
  }, [searchParams]);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'EXPENSE'],
    queryFn: () => categoriesApi.list('EXPENSE'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'expenses',
      { page, search: debouncedSearch, categoryId: categoryFilter },
    ],
    queryFn: () =>
      expensesApi.list({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: async () => {
      setConfirmDelete(null);
      setDeleteError(null);
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => setDeleteError(apiErrorMessage(err)),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses"
        description="Everything you spend — rent, stock, salaries, transport and more."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add expense
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
            placeholder="Search expenses..."
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setPage(1);
          }}
          placeholder="All categories"
        >
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <Alert variant="error" title="Could not load expenses">
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
          icon={Wallet}
          title={debouncedSearch ? 'No expenses found' : 'No expenses yet'}
          description={
            debouncedSearch
              ? 'Try a different search.'
              : 'Record expenses like rent and supplies to see your real profit.'
          }
          actionLabel={debouncedSearch ? undefined : 'Add an expense'}
          onAction={() => setFormOpen(true)}
        />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <ul className="divide-y divide-edge">
            {data.items.map((expense) => (
              <li key={expense.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {expense.description}
                    </p>
                    <p className="truncate text-xs text-foreground-5">
                      {expense.category_name ?? 'Uncategorized'} ·{' '}
                      {formatDate(expense.expense_date)} · {expense.payment_method}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-danger">
                    −{formatKES(expense.amount)}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditExpense(expense)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger-soft"
                      onClick={() => setConfirmDelete(expense)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-edge px-4 py-3">
              <p className="text-xs text-foreground-5">
                Page {page} of {totalPages} · {data.total} expenses
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
        title="Add an expense"
        description="Expenses are subtracted from your gross profit to get net profit."
      >
        <ExpenseForm onClose={() => setFormOpen(false)} />
      </Dialog>

      <Dialog
        open={Boolean(editExpense)}
        onOpenChange={(open) => !open && setEditExpense(null)}
        title="Edit expense"
      >
        {editExpense && (
          <ExpenseForm
            onClose={() => setEditExpense(null)}
            defaultValues={{
              id: editExpense.id,
              description: editExpense.description,
              amount: editExpense.amount,
              categoryId: editExpense.categoryId,
              payment_method: editExpense.payment_method,
              expense_date: editExpense.expense_date,
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this expense?"
        description={`"${confirmDelete?.description}" of ${confirmDelete ? formatKES(confirmDelete.amount) : ''} will be removed.`}
      >
        <div className="space-y-4">
          {deleteError && <Alert variant="error">{deleteError}</Alert>}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() =>
                confirmDelete && deleteMutation.mutate(confirmDelete.id)
              }
            >
              Delete expense
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
