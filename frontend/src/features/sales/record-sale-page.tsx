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
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { formatKES, uuid } from '@/lib/utils';
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 text-[13px] font-medium tracking-tight text-foreground">
      {children}
    </h2>
  );
}

export function RecordSalePage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const presetCustomer = searchParams.get('customer');
  const activeBusiness = useActiveBusiness();

  // All hooks must run on every render — never place them below an early return.
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(presetCustomer);
  const [successSale, setSuccessSale] = useState<{ id: string; total: number; payment_status: string } | null>(null);
  const idempotencyKey = useRef(uuid());

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
          key: `${item.type}-${item.id}-${uuid()}`,
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
    idempotencyKey.current = uuid();
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

  if (!activeBusiness) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No active business selected</p>
        <p className="text-sm text-foreground-5">Please select or create a business to record sales.</p>
      </div>
    );
  }

  if (successSale) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-1 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
          <CheckCircle2 className="h-9 w-9 text-success" aria-hidden />
        </span>
        <h2 className="text-lg font-medium tracking-tight text-foreground">Sale recorded!</h2>
        <p className="max-w-xs text-[13px] leading-relaxed text-foreground-3">
          Sale total of{' '}
          <span className="font-medium tabular-nums text-foreground">
            {formatKES(successSale.total)}
          </span>{' '}
          has been saved. Stock, customer and profit were updated automatically.
        </p>
        <Badge variant={statusVariant(successSale.payment_status)}>
          {statusLabel(successSale.payment_status)}
        </Badge>
        <div className="mt-2 grid w-full grid-cols-2 gap-3 pt-2">
          <Button variant="outline" className="rounded-full" onClick={resetSale}>
            Record another
          </Button>
          <Button
            className="rounded-full bg-accent text-white hover:bg-accent-strong"
            onClick={() => window.location.assign(`/sales/${successSale.id}`)}
          >
            View sale
          </Button>
        </div>
      </div>
    );
  }

  const customerList = Array.isArray(customersQuery.data)
    ? customersQuery.data
    : (customersQuery.data?.items ?? []);

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        title="Record a sale"
        description="Pick products or services, choose how they paid, and save."
        actions={
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1 text-sm font-medium text-foreground-4 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
        }
      />

      <form
        className="grid gap-6 lg:grid-cols-3"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        {/* Left — catalog + cart */}
        <div className="space-y-6 lg:col-span-2">
          {/* Catalog */}
          <section className="space-y-2">
            <SectionHeading>Add products or services</SectionHeading>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-4" aria-hidden />
              <Input
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search what you sell…"
                className="h-11 rounded-full pl-10"
              />
            </div>

            {productsQuery.isLoading || servicesQuery.isLoading ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-full" />
                ))}
              </div>
            ) : catalog.length === 0 ? (
              <p className="px-1 py-8 text-center text-[13px] text-foreground-4">
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
                        className="group flex w-full items-center gap-3 px-1 py-2 text-left transition-colors hover:bg-surface-2/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span
                          className={
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' +
                            (item.type === 'PRODUCT'
                              ? 'bg-amber-500 text-white'
                              : 'bg-purple-600 text-white')
                          }
                        >
                          {item.type === 'PRODUCT' ? (
                            <Package className="h-4 w-4" aria-hidden />
                          ) : (
                            <Scissors className="h-4 w-4" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-foreground-5">
                            {item.type === 'PRODUCT' ? 'Product' : 'Service'}
                            {item.stock !== null && ` · ${item.stock} in stock`}
                            {outOfStock && ' · out of stock'}
                          </p>
                        </div>
                        <span className="shrink-0 text-[13px] font-medium tabular-nums text-foreground">
                          {formatKES(item.unitPrice)}
                        </span>
                        {inCart ? (
                          <span className="flex shrink-0 items-center rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                            {inCart.quantity} in cart
                          </span>
                        ) : (
                          <Plus className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:scale-110" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Cart */}
          <section className="space-y-1">
            <SectionHeading>Items in this sale</SectionHeading>
            {lineItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ShoppingCart className="h-7 w-7 text-foreground-5" aria-hidden />
                <p className="text-[13px] text-foreground-4">
                  Nothing added yet. Search above and tap items to add them.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-edge">
                {lineItems.map((item) => (
                  <li key={item.key} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-[11px] tabular-nums text-foreground-5">
                        {formatKES(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => changeQuantity(item.key, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-7 text-center text-[13px] font-medium tabular-nums text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => changeQuantity(item.key, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <span className="w-20 shrink-0 text-right text-[13px] font-medium tabular-nums text-foreground">
                      {formatKES(item.unitPrice * item.quantity)}
                    </span>
                    <button
                      type="button"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground-5 transition-colors hover:bg-danger-soft hover:text-danger"
                      onClick={() =>
                        setLineItems((current) =>
                          current.filter((line) => line.key !== item.key),
                        )
                      }
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right — customer, payment, totals */}
        <div className="space-y-6">
          <section className="space-y-4">
            <SectionHeading>Customer &amp; payment</SectionHeading>

            <div className="space-y-1.5">
              <Label>Customer</Label>
              <CustomerPicker
                customers={customerList as Customer[]}
                value={customerId}
                onChange={setCustomerId}
              />
            </div>

            <div className="space-y-1.5">
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
                <p className="text-xs text-danger">{errors.paymentMethod.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount-paid">
                Amount paid now (KSh)
                {paymentMethod === 'CREDIT' && (
                  <span className="ml-1 font-normal text-foreground-5">
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
                <p className="text-xs text-danger">{errors.amountPaid.message}</p>
              )}
              {paymentMethod === 'CREDIT' && customerId && (
                <p className="text-xs font-medium text-warning">
                  This will be added to the customer's balance.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
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
                  <p className="text-xs text-danger">{errors.discount.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
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
                  <p className="text-xs text-danger">{errors.taxRate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sale-notes">Notes (optional)</Label>
              <Textarea
                id="sale-notes"
                placeholder="Anything to remember about this sale…"
                className="min-h-[64px]"
                {...register('notes')}
              />
            </div>
          </section>

          {/* Sticky totals */}
          <section className="sticky top-20 space-y-2 bg-surface-2/95 py-2 backdrop-blur-sm">
            <div className="space-y-2 border-t border-edge pt-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-foreground-4">Subtotal</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatKES(subtotal)}
                </span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground-4">Discount</span>
                  <span className="font-medium tabular-nums text-danger">
                    −{formatKES(appliedDiscount)}
                  </span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-foreground-4">Tax</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatKES(tax)}
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-edge pt-2.5">
                <span className="text-[15px] font-medium tracking-tight text-foreground">Total</span>
                <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">
                  {formatKES(total)}
                </span>
              </div>
              {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full bg-accent text-white shadow-sm hover:bg-accent-strong"
                disabled={lineItems.length === 0 || total <= 0}
                loading={mutation.isPending}
              >
                <Receipt className="h-4 w-4" aria-hidden />
                Confirm sale
              </Button>
              {lineItems.length === 0 && (
                <p className="text-center text-[11px] text-foreground-4">
                  Add at least one product or service to continue.
                </p>
              )}
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
