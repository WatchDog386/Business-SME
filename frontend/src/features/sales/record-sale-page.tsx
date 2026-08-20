import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Search,
  Receipt,
  CheckCircle2,
  Package,
  Scissors,
  ShoppingCart,
} from 'lucide-react';
import { customersApi, productsApi, servicesApi, salesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { formatKES } from '@/lib/utils';
import { DEFAULT_PAYMENT_METHODS } from '@/lib/constants';
import { useActiveBusiness } from '@/stores/business';
import { CustomerPicker } from './components/customer-picker';
import type { Customer } from '@/api/types';

interface LineItem {
  key: string;
  type: 'PRODUCT' | 'SERVICE';
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  stock: number | null;
}

const schema = z.object({
  discount: z.coerce.number().min(0).optional().or(z.literal('')),
  taxRate: z.coerce.number().min(0).max(100).optional().or(z.literal('')),
  paymentMethod: z.string().min(1, 'Select a payment method.'),
  amountPaid: z.coerce.number().min(0).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function RecordSalePage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const presetCustomer = searchParams.get('customer');
  const activeBusiness = useActiveBusiness();

  if (!activeBusiness) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-base font-bold text-foreground">No active business selected</p>
        <p className="text-sm text-foreground-5">Please select or create a business to record sales.</p>
      </div>
    );
  }

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(presetCustomer);
  const [successSale, setSuccessSale] = useState<{ id: string; total: number; payment_status: string } | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const productsQuery = useQuery({
    queryKey: ['products', { page: 1, limit: 100 }],
    queryFn: () => productsApi.list({ page: 1, limit: 100 }),
    enabled: !!activeBusiness,
  });

  const servicesQuery = useQuery({
    queryKey: ['services', { active: true }],
    queryFn: () => servicesApi.list({ active: true }),
    enabled: !!activeBusiness,
  });

  const customersQuery = useQuery({
    queryKey: ['customers', { page: 1, limit: 100 }],
    queryFn: () => customersApi.list({ page: 1, limit: 100 }),
    enabled: !!activeBusiness,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      discount: '',
      taxRate: '',
      paymentMethod: 'CASH',
      amountPaid: '',
      notes: '',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const discount = Number(watch('discount') || 0);
  const taxRate = Number(watch('taxRate') || 0);

  const subtotal = useMemo(
    () => lineItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [lineItems],
  );
  const appliedDiscount = Math.min(Math.max(0, Math.round(discount)), subtotal);
  const tax = Math.round(((subtotal - appliedDiscount) * taxRate) / 100);
  const total = subtotal - appliedDiscount + tax;

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      salesApi.create({
        items: lineItems.map((item) => ({
          productId: item.type === 'PRODUCT' ? item.id : undefined,
          serviceId: item.type === 'SERVICE' ? item.id : undefined,
          quantity: item.quantity,
        })),
        customerId: customerId ?? undefined,
        discount: Number(values.discount || 0),
        taxRate: Number(values.taxRate || 0),
        paymentMethod: values.paymentMethod,
        amountPaid: Number(values.amountPaid === '' ? 0 : values.amountPaid),
        notes: values.notes || undefined,
        idempotencyKey: idempotencyKey.current,
      }),
    onSuccess: async (sale) => {
      setSuccessSale({
        id: sale.id,
        total: sale.total,
        payment_status: sale.payment_status,
      });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => setFormError('root', { message: apiErrorMessage(err) }),
  });

  const catalog = useMemo(() => {
    const items: Array<{
      type: 'PRODUCT' | 'SERVICE';
      id: string;
      name: string;
      unitPrice: number;
      stock: number | null;
      active: boolean;
    }> = [];

    const productList = Array.isArray(productsQuery.data)
      ? productsQuery.data
      : (productsQuery.data?.items ?? []);

    for (const product of productList) {
      items.push({
        type: 'PRODUCT',
        id: product.id,
        name: product.name,
        unitPrice: product.selling_price,
        stock: product.track_inventory ? product.stock_quantity : null,
        active: product.active,
      });
    }

    const serviceList = Array.isArray(servicesQuery.data) ? servicesQuery.data : [];
    for (const service of serviceList) {
      items.push({
        type: 'SERVICE',
        id: service.id,
        name: service.name,
        unitPrice: service.price,
        stock: null,
        active: service.active,
      });
    }

    const query = catalogSearch.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.active && (!query || item.name.toLowerCase().includes(query)),
    );
  }, [productsQuery.data, servicesQuery.data, catalogSearch]);

  function addItem(item: {
    type: 'PRODUCT' | 'SERVICE';
    id: string;
    name: string;
    unitPrice: number;
    stock: number | null;
  }) {
    setLineItems((current) => {
      const existing = current.find(
        (line) => line.type === item.type && line.id === item.id,
      );
      if (existing) {
        return current.map((line) =>
          line.key === existing.key
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...current,
        {
          key: `${item.type}-${item.id}-${crypto.randomUUID()}`,
          type: item.type,
          id: item.id,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: 1,
          stock: item.stock,
        },
      ];
    });
  }

  function changeQuantity(key: string, delta: number) {
    setLineItems((current) =>
      current
        .map((line) =>
          line.key === key
            ? { ...line, quantity: Math.max(1, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function resetSale() {
    setLineItems([]);
    setCustomerId(presetCustomer);
    setSuccessSale(null);
    idempotencyKey.current = crypto.randomUUID();
    reset({
      discount: '',
      taxRate: '',
      paymentMethod: 'CASH',
      amountPaid: '',
      notes: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePaymentMethodChange(method: string) {
    setValue('paymentMethod', method);
    if (method === 'CREDIT') {
      setValue('amountPaid', 0);
    }
  }

  if (successSale) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 pt-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
              <CheckCircle2 className="h-9 w-9 text-success" aria-hidden />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">Sale recorded!</h2>
            <p className="text-sm text-foreground-5">
              Sale total of{' '}
              <span className="font-bold text-foreground">
                {formatKES(successSale.total)}
              </span>{' '}
              has been saved. Stock, customer and profit were updated automatically.
            </p>
            <Badge variant={statusVariant(successSale.payment_status)}>
              {statusLabel(successSale.payment_status)}
            </Badge>
            <div className="flex w-full gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={resetSale}
              >
                Record another sale
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  window.location.assign(`/sales/${successSale.id}`);
                }}
              >
                View sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customerList = Array.isArray(customersQuery.data)
    ? customersQuery.data
    : (customersQuery.data?.items ?? []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Record a sale"
        description="Pick products or services, choose how they paid, and save."
        actions={
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1 text-sm font-semibold text-foreground-5 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        }
      />

      <form
        className="grid gap-5 lg:grid-cols-3"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        <div className="space-y-5 lg:col-span-2">
          {/* Add items */}
          <Card>
            <CardHeader>
              <CardTitle>1. Add products or services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-5" aria-hidden />
                <Input
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Search what you sell..."
                  className="pl-9"
                />
              </div>

              {productsQuery.isLoading || servicesQuery.isLoading ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : catalog.length === 0 ? (
                <p className="rounded-xl border border-dashed border-edge px-4 py-6 text-center text-sm text-foreground-5">
                  No products or services found. Try a different search or add items in Products.
                </p>
              ) : (
                <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {catalog.map((item) => {
                    const inCart = lineItems.find(
                      (line) => line.type === item.type && line.id === item.id,
                    );
                    const outOfStock =
                      item.stock !== null &&
                      (item.stock ?? 0) <= (inCart?.quantity ?? 0);
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          onClick={() => !outOfStock && addItem(item)}
                          disabled={outOfStock}
                          className="flex w-full items-center gap-3 rounded-full border border-edge px-3 py-2.5 text-left transition-colors hover:border-accent-border hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span
                            className={
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' +
                              (item.type === 'PRODUCT'
                                ? 'bg-accent-soft text-accent'
                                : 'bg-surface-2 text-foreground-5')
                            }
                          >
                            {item.type === 'PRODUCT' ? (
                              <Package className="h-4 w-4" aria-hidden />
                            ) : (
                              <Scissors className="h-4 w-4" aria-hidden />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs text-foreground-5">
                              {item.type === 'PRODUCT' ? 'Product' : 'Service'}
                              {item.stock !== null && ` · ${item.stock} in stock`}
                              {outOfStock && ' · out of stock'}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-foreground">
                            {formatKES(item.unitPrice)}
                          </span>
                          {inCart ? (
                            <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                              {inCart.quantity} in cart
                            </span>
                          ) : (
                            <Plus className="h-4 w-4 text-accent" aria-hidden />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Items in this sale</CardTitle>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <ShoppingCart className="h-8 w-8 text-foreground-5" aria-hidden />
                  <p className="text-sm text-foreground-5">
                    Nothing added yet. Search above and tap items to add them.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-edge">
                  {lineItems.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-foreground-5">
                          {formatKES(item.unitPrice)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => changeQuantity(item.key, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => changeQuantity(item.key, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="w-20 text-right text-sm font-bold text-foreground">
                        {formatKES(item.unitPrice * item.quantity)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground-5 hover:text-danger"
                        onClick={() =>
                          setLineItems((current) =>
                            current.filter((line) => line.key !== item.key),
                          )
                        }
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>2. Customer & payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Customer</Label>
                <CustomerPicker
                  customers={customerList as Customer[]}
                  value={customerId}
                  onChange={setCustomerId}
                />
              </div>

              <div>
                <Label htmlFor="payment-method">Payment method</Label>
                <Select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(event) =>
                    handlePaymentMethodChange(event.target.value)
                  }
                  aria-invalid={errors.paymentMethod ? true : undefined}
                >
                  {DEFAULT_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method === 'M-PESA'
                        ? 'M-Pesa'
                        : method.charAt(0) + method.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
                {errors.paymentMethod && (
                  <p className="mt-1 text-xs text-danger">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="amount-paid">
                  Amount paid now (KSh)
                  {paymentMethod === 'CREDIT' && (
                    <span className="ml-1 text-xs font-normal text-foreground-5">
                      — leave 0 for credit
                    </span>
                  )}
                </Label>
                <Input
                  id="amount-paid"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  disabled={paymentMethod === 'CREDIT'}
                  placeholder={paymentMethod === 'CREDIT' ? '0' : String(total || 0)}
                  aria-invalid={errors.amountPaid ? true : undefined}
                  {...register('amountPaid')}
                />
                {errors.amountPaid && (
                  <p className="mt-1 text-xs text-danger">
                    {errors.amountPaid.message}
                  </p>
                )}
                {paymentMethod === 'CREDIT' && customerId && (
                  <p className="mt-1 text-xs text-warning">
                    This will be added to the customer's balance.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discount">Discount (KSh)</Label>
                  <Input
                    id="discount"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    aria-invalid={errors.discount ? true : undefined}
                    {...register('discount')}
                  />
                  {errors.discount && (
                    <p className="mt-1 text-xs text-danger">
                      {errors.discount.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="tax-rate">Tax (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    placeholder="0"
                    aria-invalid={errors.taxRate ? true : undefined}
                    {...register('taxRate')}
                  />
                  {errors.taxRate && (
                    <p className="mt-1 text-xs text-danger">
                      {errors.taxRate.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="sale-notes">Notes (optional)</Label>
                <Textarea
                  id="sale-notes"
                  placeholder="Anything to remember about this sale..."
                  className="min-h-[64px]"
                  {...register('notes')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>3. Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-5">Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatKES(subtotal)}
                </span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-5">Discount</span>
                  <span className="font-semibold text-danger">
                    −{formatKES(appliedDiscount)}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-5">Tax</span>
                  <span className="font-semibold text-foreground">
                    {formatKES(tax)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-edge pt-2 text-base">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-extrabold text-foreground">
                  {formatKES(total)}
                </span>
              </div>
              {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={lineItems.length === 0 || total <= 0}
                loading={mutation.isPending}
              >
                <Receipt className="h-5 w-5" />
                Confirm sale
              </Button>
              {lineItems.length === 0 && (
                <p className="text-center text-xs text-foreground-5">
                  Add at least one product or service to continue.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
