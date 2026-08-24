import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Package,
  History,
  Minus,
  Target,
  AlertTriangle,
} from 'lucide-react';
import { categoriesApi, productsApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { formatKES } from '@/lib/utils';
import { ProductForm } from './product-form';
import { StockActionForm, type StockActionType } from './stock-action-form';
import type { Product } from '@/api/types';

const PAGE_SIZE = 20;

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') setFormOpen(true);
  }, [searchParams]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<{
    product: Product;
    type: StockActionType;
  } | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'PRODUCT'],
    queryFn: () => categoriesApi.list('PRODUCT'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'products',
      { page, search: debouncedSearch, categoryId: categoryFilter, stockStatus: stockFilter },
    ],
    queryFn: () =>
      productsApi.list({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
        stockStatus: stockFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: async () => {
      setConfirmDelete(null);
      setDeleteError(null);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => setDeleteError(apiErrorMessage(err)),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="What you sell — with prices, stock levels and stock value."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add product
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              window.setTimeout(() => setDebouncedSearch(event.target.value), 300);
            }}
            placeholder="Search products..."
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
        <Select
          value={stockFilter}
          onChange={(event) => {
            setStockFilter(event.target.value);
            setPage(1);
          }}
          placeholder="All stock statuses"
        >
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </Select>
      </div>

      {error && (
        <Alert variant="error" title="Could not load products">
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
          icon={Package}
          title={debouncedSearch ? 'No products found' : 'No products yet'}
          description={
            debouncedSearch
              ? 'Try a different search or filter.'
              : 'Add the products you sell so you can start recording sales and tracking stock.'
          }
          actionLabel={debouncedSearch ? undefined : 'Add a product'}
          onAction={() => setFormOpen(true)}
        />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <ul className="divide-y divide-edge">
            {data.items.map((product) => (
              <li key={product.id} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-xs text-foreground-5">
                      {product.sku ?? 'No SKU'} · {product.category_name ?? 'No category'} ·{' '}
                      cost {formatKES(product.cost_price)}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {formatKES(product.selling_price)}
                    </p>
                    <p className="text-xs text-foreground-5">selling price</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {product.track_inventory ? product.stock_quantity : '—'}
                    </p>
                    <p className="text-xs text-foreground-5">
                      {product.track_inventory
                        ? `${formatKES(product.stock_quantity * product.cost_price)} value`
                        : 'not tracked'}
                    </p>
                  </div>
                  <Badge variant={statusVariant(product.stock_status ?? 'IN_STOCK')}>
                    {statusLabel(product.stock_status ?? 'IN_STOCK')}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStockAction({ product, type: 'restock' })}
                      title="Add stock"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStockAction({ product, type: 'adjust' })}
                      title="Set stock level"
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStockAction({ product, type: 'damage' })}
                      title="Record damaged stock"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryProduct(product)}
                      title="Movement history"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex gap-3 sm:hidden">
                  <p className="text-xs text-foreground-5">
                    Sells for {formatKES(product.selling_price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-edge px-4 py-3">
              <p className="text-xs text-foreground-5">
                Page {page} of {totalPages} · {data.total} products
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
        title="Add a product"
        description="Products are deducted from stock automatically when you sell them."
      >
        <ProductForm onClose={() => setFormOpen(false)} />
      </Dialog>

      <Dialog
        open={Boolean(editProduct)}
        onOpenChange={(open) => !open && setEditProduct(null)}
        title="Edit product"
      >
        {editProduct && (
          <ProductForm
            onClose={() => setEditProduct(null)}
            defaultValues={editProduct}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(stockAction)}
        onOpenChange={(open) => !open && setStockAction(null)}
        title={stockAction ? configTitle(stockAction.type) : ''}
      >
        {stockAction && (
          <StockActionForm
            type={stockAction.type}
            productId={stockAction.product.id}
            productName={stockAction.product.name}
            onClose={() => setStockAction(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(historyProduct)}
        onOpenChange={(open) => !open && setHistoryProduct(null)}
        title={`Stock history — ${historyProduct?.name ?? ''}`}
      >
        {historyProduct && <ProductHistory productId={historyProduct.id} />}
      </Dialog>

      <Dialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete product?"
        description={`"${confirmDelete?.name}" will be permanently removed. Products that have been sold cannot be deleted — deactivate them instead.`}
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
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
            >
              Delete product
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function configTitle(type: StockActionType): string {
  return type === 'restock'
    ? 'Add stock'
    : type === 'adjust'
      ? 'Set stock level'
      : 'Record damaged stock';
}

function ProductHistory({ productId }: { productId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-history', productId],
    queryFn: () => productsApi.history(productId),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) return <Alert variant="error">{apiErrorMessage(error)}</Alert>;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No stock movements yet"
        description="Restock, adjust or damage entries will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {data.map((movement) => (
        <li
          key={movement.id}
          className="flex items-center justify-between rounded-xl border border-edge px-3 py-2"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {statusLabel(movement.type)}
              {movement.quantity >= 0 ? ' +' : ' '}
              {movement.quantity}
            </p>
            <p className="text-xs text-foreground-5">
              {movement.reason ?? '—'}
            </p>
          </div>
          <span className="text-xs text-foreground-5">
            {new Date(movement.created_at).toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
