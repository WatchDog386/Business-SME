import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi, productsApi, salesApi, subscriptionsApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import type { Customer } from '@/api/types';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { cn, formatKES, uuid } from '@/lib/utils';

const METHODS = [
  { id: 'M-PESA', label: 'M-Pesa' },
  { id: 'CASH', label: 'Cash' },
  { id: 'BANK', label: 'Bank' },
  { id: 'CARD', label: 'Card' },
];

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Add a subscriber: client (matched by name or created), WiFi package, and
 * either record the payment now (a package sale, which starts the
 * subscription and counts the money) or add an already-paid client from a
 * start date without a sale.
 */
export function AddSubscriberForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('');
  const [recordPayment, setRecordPayment] = useState(true);
  const [method, setMethod] = useState('M-PESA');
  const [startDate, setStartDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(uuid());

  const customersQuery = useQuery({
    queryKey: ['customers', { page: 1, limit: 100 }],
    queryFn: () => customersApi.list({ page: 1, limit: 100 }),
  });
  const productsQuery = useQuery({
    queryKey: ['products', { page: 1, limit: 100 }],
    queryFn: () => productsApi.list({ page: 1, limit: 100 }),
  });

  const customers: Customer[] = customersQuery.data?.items ?? [];
  const packages = useMemo(
    () =>
      (productsQuery.data?.items ?? [])
        .filter((p) => p.billing_days && p.active)
        .sort((a, b) => a.selling_price - b.selling_price),
    [productsQuery.data],
  );
  const chosen = packages.find((p) => p.id === packageId);
  const existing = customers.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Enter the client's name.");
      if (!chosen) throw new Error('Choose a WiFi package.');
      // Existing client by name, or a new one
      let customerId = existing?.id;
      if (!customerId) {
        const res = await customersApi.list({ limit: 50, search: name.trim() }).catch(() => null);
        customerId = res?.items.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())?.id;
      }
      if (!customerId) {
        customerId = (await customersApi.create({ name: name.trim(), phone: phone.trim() || undefined })).id;
      }
      if (recordPayment) {
        // A package sale starts (or renews) the subscription and records the money
        await salesApi.create({
          items: [{ productId: chosen.id, quantity: 1 }],
          customerId,
          paymentMethod: method,
          amountPaid: chosen.selling_price,
          idempotencyKey: idempotencyKey.current,
        });
      } else {
        await subscriptionsApi.create({ customerId, productId: chosen.id, startedAt: startDate });
      }
    },
    onSuccess: async () => {
      await Promise.all(
        ['subscriptions', 'customers', 'sales', 'dashboard'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
      );
      onDone();
    },
    onError: (err) => {
      idempotencyKey.current = uuid();
      setError(err instanceof Error && !('response' in err) ? err.message : apiErrorMessage(err));
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        mutation.mutate();
      }}
      noValidate
    >
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <Label htmlFor="sub-name">Client name</Label>
        <Input
          id="sub-name"
          list="sub-client-names"
          autoComplete="off"
          placeholder="e.g. Grace Achieng"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <datalist id="sub-client-names">
          {customers.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
        <p className="mt-1 text-[11px] text-foreground-4">
          {name.trim() ? (existing ? 'Existing client' : 'New client: they will be added') : 'Pick an existing client or type a new name'}
        </p>
      </div>

      {!existing && (
        <div>
          <Label htmlFor="sub-phone">Phone (optional)</Label>
          <Input id="sub-phone" type="tel" inputMode="tel" placeholder="e.g. 0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      )}

      <div>
        <Label htmlFor="sub-package">WiFi package</Label>
        <Select id="sub-package" placeholder="Choose a package" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {formatKES(p.selling_price)} / {p.billing_days} days
            </option>
          ))}
        </Select>
      </div>

      {/* Record payment now, or add an already-paid client */}
      <button
        type="button"
        role="switch"
        aria-checked={recordPayment}
        onClick={() => setRecordPayment((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface-3 p-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-foreground">Record payment now</span>
          <span className="block text-[12px] text-foreground-4">
            {recordPayment ? 'Records the package sale and starts the subscription today' : 'Already paid: just add the subscription'}
          </span>
        </span>
        <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', recordPayment ? 'bg-brand-600' : 'bg-foreground-5/30')} aria-hidden>
          <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', recordPayment ? 'left-[22px]' : 'left-0.5')} />
        </span>
      </button>

      {recordPayment ? (
        <div>
          <Label htmlFor="sub-method">Payment method</Label>
          <Select id="sub-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
          {chosen && <p className="mt-1 text-[12px] text-foreground-3">Amount: {formatKES(chosen.selling_price)}</p>}
        </div>
      ) : (
        <div>
          <Label htmlFor="sub-start">Package started on</Label>
          <Input id="sub-start" type="date" value={startDate} max={today()} onChange={(e) => setStartDate(e.target.value)} />
          {chosen && <p className="mt-1 text-[12px] text-foreground-3">Runs for {chosen.billing_days} days from this date.</p>}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          Add subscriber
        </Button>
      </div>
    </form>
  );
}
