import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ScanLine,
  ClipboardType,
  AlertTriangle,
} from 'lucide-react';
import { customersApi, productsApi, servicesApi, salesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/spinner';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { formatKES, uuid } from '@/lib/utils';
import { DEFAULT_PAYMENT_METHODS } from '@/lib/constants';
import { useActiveBusiness } from '@/stores/business';
import type { Customer } from '@/api/types';
import { parseTransactionSms, type ParsedTransaction } from '@/lib/parse-transaction-sms';

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
  const navigate = useNavigate();
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
  const amountPaid = Number(watch('amountPaid') || 0);

  const subtotal = useMemo(
    () => lineItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [lineItems],
  );
  const appliedDiscount = Math.min(Math.max(0, Math.round(discount)), subtotal);
  const tax = Math.round(((subtotal - appliedDiscount) * taxRate) / 100);
  const total = subtotal - appliedDiscount + tax;
  const balanceOwed = Math.max(0, total - amountPaid);
  const isPartial = balanceOwed > 0 && total > 0;

  const [scanText, setScanText] = useState('');
  const [scanned, setScanned] = useState<ParsedTransaction | null>(null);
  const [paymentTab, setPaymentTab] = useState<'manual' | 'scan'>('manual');
  const [pageStep, setPageStep] = useState<1 | 2 | 3>(1);

  const handleScanExtract = () => {
    const parsed = parseTransactionSms(scanText);
    setScanned(parsed);
    if (parsed.amount) setValue('amountPaid', parsed.amount);
    if (parsed.name) {
      const list: Customer[] = Array.isArray(customersQuery.data)
        ? (customersQuery.data as Customer[])
        : ((customersQuery.data as { items?: Customer[] })?.items ?? []);
      const found = list.find((c) => c.name.toLowerCase() === (parsed.name as string).toLowerCase());
      if (found) setCustomerId(found.id);
    }
    if (parsed.code) {
      const note = `Ref: ${parsed.code}${parsed.datetime ? ` • ${parsed.datetime}` : ''}${parsed.name ? ` • ${parsed.name}` : ''}`;
      setValue('notes', note);
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Auto-resolve customer: if no customer selected but scanned name exists, find or create
      let resolvedCustomerId: string | undefined = customerId ?? undefined;
      if (!resolvedCustomerId && scanned?.name) {
        const list: Customer[] = Array.isArray(customersQuery.data)
          ? (customersQuery.data as Customer[])
          : ((customersQuery.data as { items?: Customer[] })?.items ?? []);
        let found = list.find((c) => c.name.toLowerCase() === scanned.name!.toLowerCase());
        if (!found && scanned.name) {
          try {
            const res = await customersApi.list({ limit: 50, search: scanned.name });
            found = res.items.find((c) => c.name.toLowerCase() === scanned.name!.toLowerCase());
          } catch {}
        }
        if (found) {
          resolvedCustomerId = found.id;
        } else {
          try {
            const created = await customersApi.create({
              name: scanned.name,
              phone: scanned.phone ?? undefined,
            });
            resolvedCustomerId = created.id;
          } catch {}
        }
      }
      return salesApi.create({
        items: lineItems.map((item) => ({
          productId: item.type === 'PRODUCT' ? item.id : undefined,
          serviceId: item.type === 'SERVICE' ? item.id : undefined,
          quantity: item.quantity,
        })),
        customerId: resolvedCustomerId,
        discount: Number(values.discount || 0),
        taxRate: Number(values.taxRate || 0),
        paymentMethod: values.paymentMethod,
        amountPaid: Number(values.amountPaid === '' ? 0 : values.amountPaid),
        notes: values.notes || undefined,
        idempotencyKey: idempotencyKey.current,
      });
    },
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

  return (
    <div className="space-y-4 pb-28 font-sans text-[14px]">
      {/* Header — with cart icon top right */}
      <div className="relative flex h-12 items-center justify-between">
        <button
          onClick={() => (pageStep > 1 ? setPageStep((s) => (s - 1) as 1 | 2 | 3) : navigate(-1))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-zinc-900 active:bg-zinc-800"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-tight text-foreground">Record sale</h1>
        <button
          type="button"
          onClick={() => setPageStep(2)}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {lineItems.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
              {lineItems.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Steps like onboarding */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-foreground-4">
          <span>Step {pageStep} of 3</span>
          <span>{pageStep === 1 ? 'Products & services' : pageStep === 2 ? 'Cart' : 'Checkout'}</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${s <= pageStep ? 'bg-accent' : 'bg-edge'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        {pageStep === 1 && (
          <div className="space-y-4">
            <p className="text-center text-xs text-foreground-4">Select products or services to sell</p>
          </div>
        )}

      <div className={pageStep === 1 ? 'space-y-6' : 'hidden'}>
          {/* Catalog — search and select (Step 1) */}
          <section className="space-y-2">
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
              <PageLoader inline message="Loading" />
            ) : catalog.length === 0 ? (
              <div className="px-1 py-8 text-center">
                <p className="text-[13px] text-foreground-4">No products or services found. Try a different search or add items in Products.</p>
              </div>
            ) : (
              (() => {
                const products = catalog.filter((c) => c.type === 'PRODUCT');
                const services = catalog.filter((c) => c.type === 'SERVICE');
                const renderCard = (item: (typeof catalog)[number]) => {
                  const inCart = lineItems.find((l) => l.type === item.type && l.id === item.id);
                  const outOfStock = item.stock !== null && (item.stock ?? 0) <= (inCart?.quantity ?? 0);
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => !outOfStock && addItem(item)}
                      disabled={outOfStock}
                      className="group flex w-full items-center gap-3 bg-surface-3 px-3 py-3 text-left transition-colors hover:bg-surface-2 active:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.type === 'PRODUCT' ? 'bg-amber-500 text-white' : 'bg-purple-600 text-white'}`}>
                        {item.type === 'PRODUCT' ? <Package className="h-5 w-5" aria-hidden /> : <Scissors className="h-5 w-5" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{item.name}</p>
                        <p className="truncate text-xs tabular-nums text-foreground-3">{formatKES(item.unitPrice)} {item.stock !== null && `· ${item.stock} left`}</p>
                      </span>
                      <span className="shrink-0">
                        {inCart ? (
                          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">{inCart.quantity} in cart</span>
                        ) : outOfStock ? (
                          <span className="text-xs font-medium text-danger">Out</span>
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white shadow-sm group-hover:scale-105 transition-transform">
                            <Plus className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                };
                return (
                  <div className="space-y-6">
                    {products.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                            <Package className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <h3 className="text-[13px] font-medium tracking-tight text-foreground">Products</h3>
                          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-medium text-foreground-4">{products.length}</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {products.map(renderCard)}
                        </div>
                      </section>
                    )}
                    {services.length > 0 && (
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white">
                            <Scissors className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <h3 className="text-[13px] font-medium tracking-tight text-foreground">Services</h3>
                          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-medium text-foreground-4">{services.length}</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {services.map(renderCard)}
                        </div>
                      </section>
                    )}
                  </div>
                );
              })()
            )}
           </section>
            {lineItems.length > 0 && (
              <Button type="button" onClick={() => setPageStep(2)} className="w-full rounded-full bg-brand-700 text-white h-11">
                View cart ({lineItems.reduce((a, b) => a + b.quantity, 0)} items) — {formatKES(total)} →
              </Button>
            )}
          </div>

          {/* Step 2 — Cart */}
          <div className={pageStep === 2 ? 'space-y-6' : 'hidden'}>
            <section className="space-y-2">
              <SectionHeading>Cart — what has been bought</SectionHeading>
              {lineItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-1 py-8 text-center">
                  <ShoppingCart className="h-7 w-7 text-foreground-5" aria-hidden />
                  <p className="text-[13px] text-foreground-4">Cart is empty. Go back and add products or services.</p>
                  <Button type="button" className="rounded-full bg-black text-white hover:bg-zinc-900 mt-2" onClick={() => setPageStep(1)}>
                    Back to products
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="hidden sm:grid grid-cols-[1.5fr_0.6fr_0.85fr_0.85fr_auto] gap-2 px-1 py-2">
                      <span className="text-[11px] font-medium text-foreground-4">Item</span>
                      <span className="text-center text-[11px] font-medium text-foreground-4">Qty</span>
                      <span className="text-right text-[11px] font-medium text-foreground-4">Unit</span>
                      <span className="text-right text-[11px] font-medium text-foreground-4">Total</span>
                      <span className="text-right text-[11px] font-medium text-foreground-4">Remove</span>
                    </div>
                    <ul className="divide-y divide-edge">
                      {lineItems.map((item) => (
                        <li key={item.key} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.5fr_0.6fr_0.85fr_0.85fr_auto] items-center gap-2 px-1 py-3 transition-colors hover:bg-surface-2 active:bg-surface-3">
                          <span className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-foreground">{item.name}</p>
                            <p className="text-[11px] tabular-nums text-foreground-5">{formatKES(item.unitPrice)} each</p>
                          </span>
                          <span className="flex items-center justify-center gap-1 sm:justify-center">
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => changeQuantity(item.key, -1)} aria-label="Decrease quantity">
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-6 text-center text-[13px] font-medium tabular-nums text-foreground">{item.quantity}</span>
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" onClick={() => changeQuantity(item.key, 1)} aria-label="Increase quantity">
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </span>
                          <span className="hidden sm:block text-right text-[13px] tabular-nums text-foreground-3">{formatKES(item.unitPrice)}</span>
                          <span className="hidden sm:block text-right text-[13px] font-medium tabular-nums text-foreground">{formatKES(item.unitPrice * item.quantity)}</span>
                          <span className="flex justify-end">
                            <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-soft text-danger hover:bg-red-100" onClick={() => setLineItems((current) => current.filter((line) => line.key !== item.key))} aria-label={`Remove ${item.name}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between px-1 py-3">
                      <span className="text-xs font-medium text-foreground-4">Expected amount (auto)</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">{formatKES(total)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button type="button" className="rounded-full bg-black text-white hover:bg-zinc-900 h-11" onClick={() => setPageStep(1)}>
                      Back
                    </Button>
                    <Button type="button" className="rounded-full bg-brand-700 text-white h-11" onClick={() => setPageStep(3)}>
                      Checkout
                    </Button>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Step 3 — Checkout */}
          <div className={pageStep === 3 ? 'space-y-6' : 'hidden'}>
            <section className="space-y-4">
              <SectionHeading>Checkout — payment</SectionHeading>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentTab('manual')}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors ${paymentTab === 'manual' ? 'bg-brand-700 text-white shadow-sm' : 'bg-surface-3 text-foreground-3 hover:bg-surface-2'}`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab('scan')}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${paymentTab === 'scan' ? 'bg-brand-700 text-white shadow-sm' : 'bg-surface-3 text-foreground-3 hover:bg-surface-2'}`}
              >
                <ScanLine className="h-3.5 w-3.5" /> Scan message
              </button>
            </div>

            {paymentTab === 'scan' && (
              <div className="space-y-3 px-1 py-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <ClipboardType className="h-4 w-4 text-brand-600" /> Paste M-Pesa / bank SMS
                </div>
                <Textarea
                  value={scanText}
                  onChange={(e) => setScanText(e.target.value)}
                  placeholder={`Example:\nQGH7XY8K2R Confirmed. Ksh1,500.00 paid to MARY WANJIKU on 23/8/26 at 2:30 PM...\nSystem will extract name, amount, ref, time & date.`}
                  rows={4}
                  className="bg-field text-sm"
                />
                <Button type="button" onClick={handleScanExtract} className="w-full rounded-full bg-brand-700 text-white h-9 text-xs">
                  Extract — name / amount / ref / time / date
                </Button>
                {scanned && (
                  <div className="divide-y divide-edge">
                    <div className="flex justify-between gap-2 px-1 py-2.5 hover:bg-surface-2"><span className="text-xs text-foreground-4">Name</span><span className="text-xs font-medium text-foreground truncate">{scanned.name ?? '—'}</span></div>
                    <div className="flex justify-between gap-2 px-1 py-2.5 hover:bg-surface-2"><span className="text-xs text-foreground-4">Amount</span><span className="text-xs font-medium tabular-nums text-foreground">{scanned.amount ? formatKES(scanned.amount) : '—'}</span></div>
                    <div className="flex justify-between gap-2 px-1 py-2.5 hover:bg-surface-2"><span className="text-xs text-foreground-4">Ref code</span><span className="text-xs font-medium tabular-nums text-foreground">{scanned.code ?? '—'}</span></div>
                    <div className="flex justify-between gap-2 px-1 py-2.5 hover:bg-surface-2"><span className="text-xs text-foreground-4">Date</span><span className="text-xs font-medium text-foreground">{scanned.date ?? '—'}</span></div>
                    <div className="flex justify-between gap-2 px-1 py-2.5 hover:bg-surface-2"><span className="text-xs text-foreground-4">Time</span><span className="text-xs font-medium tabular-nums text-foreground">{scanned.time ?? '—'}</span></div>
                    {scanned.datetime && <p className="px-1 py-2 text-[11px] text-foreground-5">Full: {scanned.datetime}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="payment-method">Payment method</Label>
              <Select
                id="payment-method"
                value={paymentMethod}
                onChange={(event) => handlePaymentMethodChange(event.target.value)}
                aria-invalid={errors.paymentMethod ? true : undefined}
              >
                {DEFAULT_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === 'M-PESA' ? 'M-Pesa' : method.charAt(0) + method.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
              {errors.paymentMethod && <p className="text-xs text-danger">{errors.paymentMethod.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount-paid">
                Amount paid now (KSh) — expected {formatKES(total)}
                {paymentMethod === 'CREDIT' && <span className="ml-1 font-normal text-foreground-5">— leave 0 for credit</span>}
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
              {errors.amountPaid && <p className="text-xs text-danger">{errors.amountPaid.message}</p>}
              {isPartial && (
                <div className="flex items-center justify-center gap-2 px-1 py-2 text-xs font-medium text-danger">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  <span>Insufficient</span>
                </div>
              )}
              {!isPartial && total > 0 && amountPaid === total && (
                <p className="text-xs font-medium text-success">Full amount — sale will be marked PAID.</p>
              )}
              {isPartial && (customerId || scanned?.name) && (
                <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
                  Remaining {formatKES(balanceOwed)} will be added to customer's tab (existing or new).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount (KSh) <span className="font-normal text-foreground-5">— optional</span></Label>
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
          </section>

          {/* Sticky totals — flat like settings */}
          <section className="sticky top-20 space-y-2 py-2">
            <div className="space-y-2 px-1 pt-3">
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
                className="w-full rounded-full bg-brand-700 text-white shadow-sm hover:bg-brand-800"
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
