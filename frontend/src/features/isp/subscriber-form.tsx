import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { customersApi, productsApi, salesApi, subscriptionsApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import type { AccessHours, Customer, ServiceType, SubscriberInput } from '@/api/types';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/ui/spinner';
import { cn, formatKES, uuid } from '@/lib/utils';

const SERVICE_TYPES: { id: ServiceType; label: string }[] = [
  { id: 'HOTSPOT', label: 'Hotspot' },
  { id: 'PPPOE', label: 'PPPoE' },
  { id: 'STATIC', label: 'Static IP' },
];

/** How the first package is settled when the subscriber is created. */
type Payment = 'PENDING' | 'M-PESA' | 'CASH' | 'BANK' | 'EXISTING' | 'NONE';
const PAYMENTS: { id: Payment; label: string }[] = [
  { id: 'PENDING', label: 'No — invoice remains pending' },
  { id: 'M-PESA', label: 'Yes — paid by M-Pesa' },
  { id: 'CASH', label: 'Yes — paid in cash' },
  { id: 'BANK', label: 'Yes — paid by bank' },
  { id: 'EXISTING', label: 'Already connected — no invoice' },
  { id: 'NONE', label: 'No package yet (pending subscriber)' },
];

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

type DayHours = { on: boolean; from: string; to: string };

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hoursFrom(saved: AccessHours | null | undefined): Record<string, DayHours> {
  return Object.fromEntries(
    DAYS.map((d) => [d.id, saved?.[d.id] ? { on: true, ...saved[d.id] } : { on: false, from: '00:00', to: '23:59' }]),
  );
}

/** A plain group heading inside the sheet; fields stack like the other forms. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-4">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-foreground-4">{hint}</p>}
    </div>
  );
}

/**
 * Add or edit a subscriber with every account detail an ISP keeps: profile,
 * contacts, location, wallet, service login, and (when adding) the first
 * package and how it was paid. Sits in the same sheet as before.
 */
export function SubscriberForm({
  customerId,
  onDone,
  onCancel,
}: {
  /** Set to edit that subscriber; leave out to add a new one. */
  customerId?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const id = customerId;
  const editing = Boolean(id);
  const queryClient = useQueryClient();

  const optionsQuery = useQuery({ queryKey: ['customer-options'], queryFn: () => customersApi.options() });
  const productsQuery = useQuery({
    queryKey: ['products', { page: 1, limit: 100 }],
    queryFn: () => productsApi.list({ page: 1, limit: 100 }),
  });
  const customerQuery = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.get(id!),
    enabled: editing,
  });

  const packages = useMemo(
    () =>
      (productsQuery.data?.items ?? [])
        .filter((p) => p.billing_days && p.active)
        .sort((a, b) => a.selling_price - b.selling_price),
    [productsQuery.data],
  );
  const options = optionsQuery.data;

  // ---- Customer profile ----
  const [accountNumber, setAccountNumber] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [smsGroup, setSmsGroup] = useState('');
  const [newInstallation, setNewInstallation] = useState(true);
  const [discount, setDiscount] = useState('0');
  const [wallet, setWallet] = useState('0');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  // ---- Service ----
  const [serviceType, setServiceType] = useState<ServiceType>('PPPOE');
  const [packageId, setPackageId] = useState('');
  const [router, setRouter] = useState('');
  const [mac, setMac] = useState('');
  const [payment, setPayment] = useState<Payment>('PENDING');
  const [mpesaCode, setMpesaCode] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [burstId, setBurstId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [hours, setHours] = useState<Record<string, DayHours>>(() => hoursFrom(null));

  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(uuid());
  const filled = useRef(false);

  // New subscriber: suggest the next account number (username follows it)
  useEffect(() => {
    if (!editing && options && !accountNumber) {
      setAccountNumber(options.nextAccountNumber);
      if (!usernameTouched) setUsername(options.nextAccountNumber);
    }
  }, [editing, options, accountNumber, usernameTouched]);

  // Editing: fill the form once from the saved record
  useEffect(() => {
    const c: Customer | undefined = customerQuery.data;
    if (!c || filled.current) return;
    filled.current = true;
    setAccountNumber(c.account_number ?? '');
    setUsername(c.username ?? '');
    setUsernameTouched(true);
    setName(c.name);
    setPhone(c.phone ?? '');
    setExtraPhones(c.extra_phones ?? []);
    setEmail(c.email ?? '');
    setKraPin(c.kra_pin ?? '');
    setLocation(c.location ?? '');
    setAddress(c.address ?? '');
    setSmsGroup(c.sms_group ?? '');
    setNewInstallation(c.new_installation);
    setDiscount(String(c.discount ?? 0));
    setWallet(String(c.wallet_balance ?? 0));
    setServiceType(c.service_type ?? 'PPPOE');
    setRouter(c.router ?? '');
    setMac(c.mac_address ?? '');
    setBurstId(c.burst_product_id ?? '');
    setRemarks(c.notes ?? '');
    setHours(hoursFrom(c.access_hours));
  }, [customerQuery.data]);

  const chosen = packages.find((p) => p.id === packageId);
  const discountKes = Math.max(0, Math.round(Number(discount) || 0));
  const due = chosen ? Math.max(0, chosen.selling_price - discountKes) : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Enter the full name.');
      if (!phone.trim()) throw new Error('Enter the primary phone number.');
      if (password !== confirm) throw new Error('The service passwords do not match.');
      if (!editing && payment !== 'NONE' && !chosen) throw new Error('Choose a package, or pick "No package yet".');

      const accessHours = Object.fromEntries(
        Object.entries(hours)
          .filter(([, h]) => h.on)
          .map(([day, h]) => [day, { from: h.from, to: h.to }]),
      );
      const data: SubscriberInput & { name: string } = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: remarks.trim(),
        accountNumber: accountNumber.trim(),
        username: username.trim(),
        extraPhones: extraPhones.map((p) => p.trim()).filter(Boolean),
        kraPin: kraPin.trim(),
        location: location.trim(),
        smsGroup: smsGroup.trim(),
        newInstallation,
        discount: discountKes,
        walletBalance: Math.max(0, Math.round(Number(wallet) || 0)),
        serviceType,
        router: router.trim(),
        macAddress: mac.trim(),
        burstProductId: burstId || null,
        accessHours: Object.keys(accessHours).length ? accessHours : null,
        ...(password ? { servicePassword: password } : {}),
      };

      if (editing) {
        await customersApi.update(id!, data);
        return id!;
      }

      const customer = await customersApi.create(data);
      if (chosen && payment === 'EXISTING') {
        await subscriptionsApi.create({ customerId: customer.id, productId: chosen.id, startedAt: startDate });
      } else if (chosen && payment !== 'NONE') {
        // A package sale starts the subscription and raises the invoice
        const paid = payment !== 'PENDING';
        await salesApi.create({
          items: [{ productId: chosen.id, quantity: 1 }],
          customerId: customer.id,
          discount: Math.min(discountKes, chosen.selling_price),
          paymentMethod: paid ? payment : 'CREDIT',
          amountPaid: paid ? due : 0,
          reference: payment === 'M-PESA' && mpesaCode.trim() ? mpesaCode.trim().toUpperCase() : undefined,
          idempotencyKey: idempotencyKey.current,
        });
      }
      return customer.id;
    },
    onSuccess: async () => {
      await Promise.all(
        ['subscriptions', 'subscribers', 'customers', 'customer-options', 'sales', 'dashboard'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      );
      onDone();
    },
    onError: (err) => {
      idempotencyKey.current = uuid();
      setError(err instanceof Error && !('response' in err) ? err.message : apiErrorMessage(err));
    },
  });

  if (editing && customerQuery.isLoading) return <PageLoader inline message="Loading" />;

  return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        noValidate
      >
        {error && <Alert variant="error">{error}</Alert>}
        <Section title="Customer profile">
          <Field label="Account number" htmlFor="sf-account" hint="Clients sign in to the app with this, e.g. CY-348.">
            <Input
              id="sf-account"
              autoComplete="off"
              autoCapitalize="characters"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                if (!usernameTouched) setUsername(e.target.value);
              }}
            />
          </Field>
          <Field label="Username" htmlFor="sf-username" hint="Service login; follows the account number unless changed.">
            <Input
              id="sf-username"
              autoComplete="off"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameTouched(true);
              }}
            />
          </Field>

          <Field label="Full name" htmlFor="sf-name">
            <Input id="sf-name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Primary phone number" htmlFor="sf-phone">
            <Input id="sf-phone" type="tel" inputMode="tel" placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>

          <div>
            <Label>Additional phone numbers</Label>
            <div className="space-y-2">
              {extraPhones.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="tel"
                    inputMode="tel"
                    aria-label={`Additional phone ${i + 1}`}
                    placeholder="0722000000"
                    value={p}
                    onChange={(e) => setExtraPhones((list) => list.map((v, j) => (j === i ? e.target.value : v)))}
                  />
                  <button
                    type="button"
                    aria-label="Remove number"
                    onClick={() => setExtraPhones((list) => list.filter((_, j) => j !== i))}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-foreground-3 active:scale-90"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
              {extraPhones.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setExtraPhones((list) => [...list, ''])}>
                  <Plus className="h-4 w-4" aria-hidden /> Add phone number
                </Button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-foreground-4">
              SMS and WhatsApp notices go to every saved number. The primary number stays the account and payment contact.
            </p>
          </div>

          <Field label="Email address" htmlFor="sf-email">
            <Input id="sf-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="KRA PIN" htmlFor="sf-kra">
            <Input id="sf-kra" autoComplete="off" className="uppercase" value={kraPin} onChange={(e) => setKraPin(e.target.value)} />
          </Field>

          <Field label="Location" htmlFor="sf-location" hint="Pick a known estate or type a new one.">
            <Input
              id="sf-location"
              list="sf-locations"
              autoComplete="off"
              placeholder="e.g. Imara Daima"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <datalist id="sf-locations">
              {options?.locations.map((l) => <option key={l} value={l} />)}
            </datalist>
          </Field>
          <Field label="House / building" htmlFor="sf-address">
            <Input id="sf-address" autoComplete="off" placeholder="e.g. Block C, House 12" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>

          <Field label="SMS group" htmlFor="sf-group">
            <Input
              id="sf-group"
              list="sf-groups"
              autoComplete="off"
              placeholder="None"
              value={smsGroup}
              onChange={(e) => setSmsGroup(e.target.value)}
            />
            <datalist id="sf-groups">
              {options?.smsGroups.map((g) => <option key={g} value={g} />)}
            </datalist>
          </Field>
          <Field label="New installation" htmlFor="sf-install">
            <Select id="sf-install" value={newInstallation ? 'yes' : 'no'} onChange={(e) => setNewInstallation(e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>

          <Field label="Discount amount (KSh)" htmlFor="sf-discount" hint="Taken off each package invoice.">
            <Input id="sf-discount" type="number" inputMode="numeric" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>
          <Field label={editing ? 'Wallet credit (KSh)' : 'Opening wallet credit (KSh)'} htmlFor="sf-wallet">
            <Input id="sf-wallet" type="number" inputMode="numeric" min={0} value={wallet} onChange={(e) => setWallet(e.target.value)} />
          </Field>

          <Field label="Service password" htmlFor="sf-password" hint={editing ? 'Leave blank to keep the current password.' : undefined}>
            <Input id="sf-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm password" htmlFor="sf-confirm">
            <Input
              id="sf-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={confirm && confirm !== password ? true : undefined}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm && confirm !== password && <p className="mt-1 text-xs font-medium text-danger">Passwords do not match.</p>}
          </Field>
        </Section>

        <Section title={editing ? 'Service' : 'Initial service'}>
          <div>
            <Label>Service type</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Service type">
              {SERVICE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={serviceType === t.id}
                  onClick={() => setServiceType(t.id)}
                  className={cn(
                    'flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors',
                    serviceType === t.id ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-edge bg-field text-foreground-2',
                  )}
                >
                  <span
                    className={cn(
                      'h-4 w-4 rounded-full border-2',
                      serviceType === t.id ? 'border-brand-600 bg-brand-600 shadow-[inset_0_0_0_2px_white]' : 'border-foreground-5',
                    )}
                    aria-hidden
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {!editing && (
            <Field label="Package" htmlFor="sf-package">
              <Select id="sf-package" placeholder="Choose a package" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {formatKES(p.selling_price)} / {p.billing_days} days
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Router / NAS" htmlFor="sf-router">
            <Input
              id="sf-router"
              list="sf-routers"
              autoComplete="off"
              placeholder="e.g. IMARADAIMA"
              value={router}
              onChange={(e) => setRouter(e.target.value)}
            />
            <datalist id="sf-routers">
              {options?.routers.map((r) => <option key={r} value={r} />)}
            </datalist>
          </Field>

          <Field label="MAC address (optional)" htmlFor="sf-mac" hint="Leave blank unless you need device binding.">
            <Input id="sf-mac" autoComplete="off" placeholder="AA:BB:CC:DD:EE:FF" className="uppercase" value={mac} onChange={(e) => setMac(e.target.value)} />
          </Field>
          <Field label="Burst package (optional)" htmlFor="sf-burst">
            <Select id="sf-burst" value={burstId} onChange={(e) => setBurstId(e.target.value)}>
              <option value="">None</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>

          {!editing && (
            <>
              <Field label="Payment received?" htmlFor="sf-payment">
                <Select id="sf-payment" value={payment} onChange={(e) => setPayment(e.target.value as Payment)}>
                  {PAYMENTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
                {chosen && payment !== 'NONE' && payment !== 'EXISTING' && (
                  <p className="mt-1 text-[12px] text-foreground-3">
                    Invoice: {formatKES(due)}
                    {discountKes > 0 && ` (after ${formatKES(Math.min(discountKes, chosen.selling_price))} discount)`}
                    {payment === 'PENDING' ? ' · added to the client’s debt' : ' · marked paid'}
                  </p>
                )}
              </Field>
              {payment === 'M-PESA' && (
                <Field label="M-Pesa code (optional)" htmlFor="sf-mpesa">
                  <Input id="sf-mpesa" autoComplete="off" className="uppercase" placeholder="e.g. QRT8XYZ9A1" value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value)} />
                </Field>
              )}
              {payment === 'EXISTING' && (
                <Field label="Package started on" htmlFor="sf-start" hint={chosen ? `Runs for ${chosen.billing_days} days from this date.` : undefined}>
                  <Input id="sf-start" type="date" value={startDate} max={today()} onChange={(e) => setStartDate(e.target.value)} />
                </Field>
              )}
            </>
          )}

          <Field label="Remarks" htmlFor="sf-remarks">
            <Textarea id="sf-remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Field>

          {/* Allowed hours per day: ticked days only connect inside their window */}
          <div>
            <Label>Access hours (optional)</Label>
            <p className="mb-2 text-[11px] text-foreground-4">Tick a day to limit it to the hours set. Unticked days have no limit.</p>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map((d) => {
                const h = hours[d.id];
                const set = (patch: Partial<DayHours>) => setHours((all) => ({ ...all, [d.id]: { ...all[d.id], ...patch } }));
                return (
                  <div key={d.id} className={cn('rounded-xl border p-2', h.on ? 'border-brand-300 bg-brand-50/50' : 'border-edge')}>
                    <label className="mb-1.5 flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <input type="checkbox" checked={h.on} onChange={(e) => set({ on: e.target.checked })} className="h-4 w-4 accent-brand-600" />
                      {d.label}
                    </label>
                    <div className="space-y-1.5">
                      <Input type="time" aria-label={`${d.label} from`} disabled={!h.on} value={h.from} onChange={(e) => set({ from: e.target.value })} className="h-9 px-3 text-[13px]" />
                      <Input type="time" aria-label={`${d.label} to`} disabled={!h.on} value={h.to} onChange={(e) => set({ to: e.target.value })} className="h-9 px-3 text-[13px]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {editing ? 'Save changes' : 'Add subscriber'}
          </Button>
        </div>
      </form>
  );
}
