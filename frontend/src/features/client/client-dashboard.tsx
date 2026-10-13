import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Download,
  Loader2,
  Phone,
  Receipt,
  RefreshCw,
  Smartphone,
  UserCog,
} from 'lucide-react';
import {
  DuoCalls,
  DuoCustomers,
  DuoProducts,
  DuoReports,
  DuoSales,
} from '@/components/brand/duo-icons';
import { QuickActions, type QuickAction } from '@/features/dashboard/components/quick-actions';
import { PackageCard, planStyle } from '@/features/products/package-card';
import type { Product } from '@/api/types';
import { clientApi, type ClientHome, type StkPush } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { useAuthStore } from '@/stores/auth';
import { cn, formatDate, formatKES } from '@/lib/utils';

type Pkg = ClientHome['packages'][number];

/** Lime green from the reference design, already used by the app's own dialogs. */
const GREEN = '#8BC53F';
/** Dark green of the package card. */
const CARD_FROM = '#12463A';
const CARD_MID = '#0D5B3F';
const CARD_TO = '#072A21';

const STATUS = {
  ACTIVE: { label: 'Connected', cls: 'bg-emerald-400/20 text-emerald-200', bar: '#8BC53F' },
  EXPIRING: { label: 'Expiring soon', cls: 'bg-amber-400/20 text-amber-200', bar: '#F08C21' },
  EXPIRED: { label: 'Expired', cls: 'bg-red-400/20 text-red-200', bar: '#E23B41' },
} as const;

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

/** Glossy green ball with a shine across the top, like the reference's icons and avatar. */
function GlossyBall({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-full border-2 border-white/85 bg-[radial-gradient(circle_at_30%_24%,#A9E06D_0%,#57A81E_38%,#2F7A0C_70%,#17540A_100%)] text-white shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_-3px_6px_rgba(0,0,0,0.35)]',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/45 to-white/0"
      />
      <span className="relative">{children}</span>
    </span>
  );
}

/** Translucent panel sitting over the photo, so the photo reads through it. */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        'rounded-lg border border-white/15 bg-black/55 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md',
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Outlined pill button used on the dark panels. */
function PillButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-white/70 text-[13px] font-semibold text-white transition-transform active:scale-[0.97]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Client dashboard: a WiFi client's own app, laid out like the reference banking
 * home screen — a photo behind the page, a dark top bar with the greeting, a green
 * package card, a balance strip, quick actions and a floating bottom bar.
 * They never see anything of the business beyond this.
 */
export function ClientDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [payFor, setPayFor] = useState<Pkg | null>(null);
  const [query, setQuery] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['client-me'], queryFn: clientApi.me });
  const topRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const paymentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('page-white', 'dash-glow-body');
    return () => document.body.classList.remove('page-white', 'dash-glow-body');
  }, []);

  if (isLoading) return <WorkspaceLoader />;
  if (error || !data) {
    return (
      <div className="space-y-4 pt-10">
        <Alert variant="error" title="Could not load your account">
          {apiErrorMessage(error)}
        </Alert>
        <button type="button" onClick={logout} className="mx-auto block text-[13px] font-semibold text-foreground-3">
          Sign out
        </button>
      </div>
    );
  }

  const sub = data.subscription;
  const current = data.packages.find((p) => p.id === sub?.productId) ?? null;
  const status = sub ? STATUS[sub.status] : null;
  const firstName = (data.customer.name || user?.fullName || '').split(' ')[0];
  const period = current?.billingDays ?? 30;
  const left = sub ? Math.max(0, Math.min(1, sub.daysLeft / period)) : 0;
  const phoneDigits = (data.business.phone ?? '').replace(/\D/g, '').replace(/^0/, '254');
  const q = query.trim().toLowerCase();
  /** Packages matching the search; kept in their original order so plan colours stay put. */
  const visiblePackages = data.packages
    .map((pkg, index) => ({ pkg, index }))
    .filter(({ pkg }) => q === '' || pkg.name.toLowerCase().includes(q));

const jump = (ref: React.RefObject<HTMLDivElement>) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /** Quick actions reuse the admin dashboard's own grid, so the tiles always match. */
  const quickActions: QuickAction[] = [
    { to: 'pay', label: 'Pay with M-Pesa', icon: DuoSales },
    { to: 'packages', label: 'Packages', icon: DuoProducts },
    { to: 'receipts', label: 'Receipts', icon: DuoReports },
    { to: 'call', label: 'Call us', icon: DuoCalls },
    { to: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
    { to: 'details', label: 'My account', icon: DuoCustomers },
  ].filter((a) => a.to !== 'call' || Boolean(data.business.phone)) as QuickAction[];

  const onQuickAction = (to: string) => {
    if (to === 'pay') return current && setPayFor(current);
    if (to === 'packages') return jump(cardsRef);
    if (to === 'receipts') return jump(paymentsRef);
    if (to === 'call') return window.location.assign(`tel:${data.business.phone}`);
    if (to === 'whatsapp') return window.open(`https://wa.me/${phoneDigits}`, '_blank');
    if (to === 'details') return navigate('/my-account');
  };

  return (
    <div className="relative isolate -mx-4 -mt-2 min-h-[100dvh] pb-8">
      {/* Photo behind the whole page, dark enough for white text to read */}
      <img
        src="/images/splash-savanna.jpg"
        alt=""
        aria-hidden
        className="fixed inset-0 -z-20 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/75"
      />

      <div ref={topRef} />

      {/* Top bar: avatar, centred greeting, then notifications and the account button */}
      <header className="sticky top-0 z-30 -mx-4 flex items-center gap-4 bg-black/45 py-3 pl-5 pr-9 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <GlossyBall className="h-12 w-12 shrink-0">
          <span className="-skew-x-12 text-[20px] font-black leading-none [text-shadow:0_2px_3px_rgba(0,0,0,0.45)]">
            {initials(data.customer.name).slice(0, 1)}
          </span>
        </GlossyBall>
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold text-white">
          Hello {firstName} 👋
        </h1>
        <button
          type="button"
          onClick={() => jump(paymentsRef)}
          className="relative shrink-0 text-white transition-transform active:scale-90"
          aria-label="Notifications and receipts"
        >
          <Bell className="h-6 w-6" strokeWidth={1.9} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => navigate('/my-account')}
          className="shrink-0 text-white transition-transform active:scale-90"
          aria-label="My account"
        >
          <UserCog className="h-6 w-6" strokeWidth={1.9} aria-hidden />
        </button>
      </header>

      <div className="px-4 pt-3">
        {/* Search, filtered against the packages below */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search packages…"
          className="w-full rounded-full border border-white/15 bg-black/40 px-4 py-3 text-sm font-medium text-white outline-none placeholder:font-medium placeholder:text-white/60"
          autoComplete="off"
          aria-label="Search packages"
        />

        {/* Hero: a single card for the subscribed package, in the reference's card style */}
        {current ? (
          <article
            className="relative mt-4 overflow-hidden rounded-lg border border-white/15 p-5 text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)]"
            style={{ background: `linear-gradient(135deg, ${CARD_FROM} 0%, ${CARD_MID} 55%, ${CARD_TO} 100%)` }}
          >
            {/* Faint decorative arcs on the right, like the reference card */}
            <svg
              className="pointer-events-none absolute -right-10 top-0 h-full w-1/2 opacity-25"
              viewBox="0 0 200 200"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden
            >
              <g fill="none" stroke="white" strokeWidth="0.7">
                {[26, 44, 62, 80, 98].map((r) => (
                  <circle key={r} cx="200" cy="70" r={r} />
                ))}
              </g>
            </svg>

            <div className="relative">
              <p className="text-[13px] text-white/80">My WiFi package</p>
              <p className="mt-1 text-[13px] font-semibold uppercase tracking-wide text-white/90">
                {data.customer.name}
              </p>

              <p className="mt-3 flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[22px] font-semibold leading-tight">
                  {current.name.replace(/\s*\d+\s*mbps\s*$/i, '')}
                </span>
                <span className="shrink-0 text-[15px] font-medium text-white/85">
                  {current.speedMbps ? `${current.speedMbps} Mbps` : 'Unlimited'}
                </span>
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <PillButton onClick={() => jump(paymentsRef)}>
                  <Receipt className="h-4 w-4" aria-hidden />
                  Statement
                </PillButton>
                <PillButton onClick={() => setPayFor(current)}>
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  {sub?.status === 'EXPIRED' ? 'Renew' : 'Deposit'}
                </PillButton>
              </div>

              <p className="mt-3 text-[12px] text-white/70">
                {Math.max(0, sub?.daysLeft ?? 0)} days left · {formatKES(current.price)}
                {status && (
                  <span className={cn('ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold', status.cls)}>
                    {status.label}
                  </span>
                )}
              </p>
            </div>
          </article>
        ) : (
          <Panel className="mt-4 p-5">
            <p className="text-[18px] font-semibold text-white">No WiFi package yet</p>
            <p className="mt-1 text-[13px] text-white/75">Pick a package below and pay with M-Pesa to get connected.</p>
          </Panel>
        )}

        {/* Days-left bar, in the reference's loan balance style */}
        {sub && (
          <div className="relative mt-4 flex items-stretch overflow-hidden rounded-[20px] border border-white/15 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.85)]">
            <div
              className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3.5 text-white"
              style={{ background: `linear-gradient(120deg, ${CARD_FROM} 0%, ${CARD_MID} 100%)` }}
            >
              <p className="min-w-0 truncate text-[13px] text-white/90">
                Days left: <span className="font-semibold text-white">{Math.max(0, sub.daysLeft)}</span>
              </p>
              <div className="h-1.5 min-w-[40px] flex-1 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(3, left * 100)}%`, background: status?.bar }}
                />
              </div>
            </div>

            {/* Diagonal notch between the two halves, like the reference */}
            <span
              aria-hidden
              className="w-5 shrink-0 bg-white/10"
              style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
            />

            <button
              type="button"
              onClick={() => current && setPayFor(current)}
              className="flex shrink-0 items-center gap-2 px-4 py-3.5 text-white"
              style={{ background: `linear-gradient(120deg, ${CARD_MID} 0%, ${CARD_TO} 100%)` }}
            >
              <span className="whitespace-nowrap text-[13px] font-medium">
                {sub.status === 'EXPIRED' ? 'Renew now' : 'Pay now'}
              </span>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ border: `2px solid ${GREEN}` }}
              >
                <ArrowRight className="h-4 w-4" style={{ color: GREEN }} aria-hidden />
              </span>
            </button>
          </div>
        )}

        {/* Quick actions: the admin dashboard's own grid, on the dark panel */}
        <Panel className="mt-4 p-4">
          <QuickActions
            items={quickActions}
            viewAll={false}
            onSelect={onQuickAction}
            titleClassName="!text-white"
            labelClassName="!text-white"
          />
        </Panel>

        {/* Packages, using the same PackageCard the admin dashboard and staff pages use.
            Two show at a time; the rest scroll in from the side. */}
        <section ref={cardsRef} className="mt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-white">
              {current ? 'Change package' : 'Choose a package'}
            </h2>
            <span className="text-[12px] text-white/70">Pay with M-Pesa</span>
          </div>
          {visiblePackages.length === 0 ? (
            <Panel className="px-4 py-6 text-center text-[13px] text-white/75">
              No package matches “{query.trim()}”.
            </Panel>
          ) : (
            <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
              {visiblePackages.map(({ pkg: p, index: i }) => {
                const name = p.name.replace(/\s*\d+\s*mbps\s*$/i, '') || p.name;
                const style = planStyle(name, i);
                const mine = p.id === current?.id;
                return (
                  <div key={p.id} className="w-[calc(50%-0.375rem)] shrink-0 snap-start">
                    <PackageCard
                      product={toProduct(p)}
                      index={i}
                      onAdd={() => setPayFor(p)}
                      footer={
                        <button
                          type="button"
                          onClick={() => setPayFor(p)}
                          className="inline-flex h-10 items-center rounded-xl border-[1.5px] px-3.5 text-[13px] font-medium tabular-nums transition-colors active:opacity-70"
                          style={
                            mine
                              ? { background: style.from, borderColor: style.from, color: '#FFFFFF' }
                              : { borderColor: style.from, color: style.from }
                          }
                        >
                          {mine ? 'My package · Pay' : `Pay · KSh ${p.price.toLocaleString('en-KE')}`}
                        </button>
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* My payments */}
        <div ref={paymentsRef} className="mt-4">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-white">My payments</h2>
              <span className="text-[12px] text-white/70">{data.payments.length}</span>
            </div>
            {data.payments.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-white/70">No payments yet.</p>
            ) : (
              <ul className="space-y-1">
                {data.payments.map((p) => (
                  <PaymentRow key={p.id} payment={p} />
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* Need help */}
        {data.business.phone && (
          <div className="pt-4">
            <Panel className="p-4">
              <p className="text-[15px] font-semibold text-white">Need help with your WiFi?</p>
              <p className="mt-0.5 text-[12px] text-white/75">
                Our support team at {data.business.name} is here for you.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <PillButton onClick={() => window.location.assign(`tel:${data.business.phone}`)}>
                  <Phone className="h-4 w-4" aria-hidden />
                  Call us
                </PillButton>
                <PillButton onClick={() => window.open(`https://wa.me/${phoneDigits}`, '_blank')}>
                  <WhatsAppIcon className="h-4 w-4" aria-hidden />
                  WhatsApp
                </PillButton>
              </div>
            </Panel>
          </div>
        )}
      </div>



      <Dialog
        open={Boolean(payFor)}
        onOpenChange={(o) => !o && setPayFor(null)}
        title={payFor ? `Pay for ${payFor.name.replace(/\s*\d+\s*mbps\s*$/i, '')}` : 'Pay'}
        description={payFor ? `${formatKES(payFor.price)} for ${payFor.billingDays ?? 30} days of WiFi` : undefined}
      >
        {payFor && <PaySheet pkg={payFor} defaultPhone={data.customer.phone ?? ''} onDone={() => setPayFor(null)} />}
      </Dialog>
    </div>
  );
}

/** Client packages are the lean shape; PackageCard expects the staff Product shape. */
function toProduct(p: ClientHome['packages'][number]): Product {
  return {
    id: p.id,
    businessId: '',
    name: p.name,
    sku: null,
    categoryId: null,
    cost_price: 0,
    selling_price: p.price,
    stock_quantity: 0,
    low_stock_threshold: 0,
    track_inventory: false,
    active: true,
    created_at: '',
    updated_at: '',
    billing_days: p.billingDays,
    speed_mbps: p.speedMbps,
    description: p.description,
  };
}

function PaymentRow({ payment }: { payment: ClientHome['payments'][number] }) {
  const [busy, setBusy] = useState<'invoice' | 'receipt' | null>(null);
  const paid = payment.status === 'PAID' || payment.status === 'PARTIAL';
  const get = async (kind: 'invoice' | 'receipt') => {
    setBusy(kind);
    try {
      await clientApi.document(payment.id, kind);
    } finally {
      setBusy(null);
    }
  };
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
        <Receipt className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold tabular-nums text-white">{formatKES(payment.total)}</span>
        <span className="block truncate text-[12px] text-white/70">
          {formatDate(payment.at)} · {payment.method === 'M-PESA' ? 'M-Pesa' : payment.method.toLowerCase()}
          {!paid ? ' · unpaid' : ''}
        </span>
      </span>
      <button
        type="button"
        onClick={() => get(paid ? 'receipt' : 'invoice')}
        disabled={busy !== null}
        className="flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[12px] font-semibold text-white active:scale-95 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {paid ? 'Receipt' : 'Invoice'}
      </button>
    </li>
  );
}

/** M-Pesa prompt to the client's phone; waits for the PIN, then the package renews. */
function PaySheet({ pkg, defaultPhone, onDone }: { pkg: Pkg; defaultPhone: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(defaultPhone);
  const [push, setPush] = useState<(StkPush & { saleId?: string | null }) | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    setSending(true);
    try {
      setPush(await clientApi.pay({ productId: pkg.id, phone }));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!push || push.state !== 'pending') return;
    const timer = window.setTimeout(async () => {
      try {
        const next = await clientApi.payStatus(push.checkoutRequestId);
        setPush(next);
        if (next.state === 'paid') await queryClient.invalidateQueries({ queryKey: ['client-me'] });
      } catch {
        setPush({ ...push });
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [push, queryClient]);

  if (push?.state === 'paid') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" aria-hidden />
        </span>
        <p className="text-[18px] font-semibold text-foreground">Payment received</p>
        <p className="text-[13px] text-foreground-3">
          Your {pkg.name.replace(/\s*\d+\s*mbps\s*$/i, '')} package is renewed.{push.receipt ? ` M-Pesa ${push.receipt}.` : ''}
        </p>
        <button type="button" onClick={onDone} className="mt-2 h-12 w-full rounded-2xl bg-[#3A8F91] text-[15px] font-semibold text-white">
          Done
        </button>
      </div>
    );
  }

  if (push?.state === 'pending') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#3A8F91]/25" aria-hidden />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#3A8F91] text-white">
            <Smartphone className="h-6 w-6" aria-hidden />
          </span>
        </span>
        <p className="text-[16px] font-semibold text-foreground">Check your phone</p>
        <p className="text-[13px] text-foreground-3">
          Enter your M-Pesa PIN to pay {formatKES(push.amount)}. This page updates on its own.
        </p>
        <button type="button" onClick={() => setPush(null)} className="text-[12px] font-semibold text-[#2F7F81]">
          Change number or send again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {push && <Alert variant="error">{push.message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <label htmlFor="client-pay-phone" className="mb-1 block text-[12px] font-medium text-foreground-3">
          Your M-Pesa number
        </label>
        <Input id="client-pay-phone" type="tel" inputMode="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button
        type="button"
        onClick={send}
        disabled={sending || !phone.trim()}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#3A8F91] text-[15px] font-semibold text-white disabled:opacity-50"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
        Pay {formatKES(pkg.price)} with M-Pesa
      </button>
      <p className="text-center text-[11px] text-foreground-4">You'll get a prompt on your phone. Your WiFi renews as soon as you pay.</p>
    </div>
  );
}