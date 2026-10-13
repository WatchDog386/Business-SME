import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  EyeOff,
  Home,
  Loader2,
  Package as PackageIcon,
  Receipt,
  RefreshCw,
  Search,
  Smartphone,
  UserCog,
  Wifi,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { clientApi, type ClientHome, type StkPush } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { useAuthStore } from '@/stores/auth';
import { notifySuccess } from '@/components/ui/popup-host';
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

/** Dark translucent panel sitting over the photo. */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        'rounded-[26px] border border-white/15 bg-black/55 shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] backdrop-blur-md',
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
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [payFor, setPayFor] = useState<Pkg | null>(null);
  const [tab, setTab] = useState<'package' | 'payments'>('package');
  const [showNumber, setShowNumber] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ['client-me'], queryFn: clientApi.me });
  const topRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
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
  const accountNo = data.customer.phone ?? data.business.phone ?? '';

  const jump = (ref: React.RefObject<HTMLDivElement>) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /** Round glossy shortcut in the Quick Actions grid. */
  const action = (Icon: ComponentType<{ className?: string }>, label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <GlossyBall className="h-14 w-14">
        <Icon className="h-6 w-6" />
      </GlossyBall>
      <span className="line-clamp-2 text-center text-[12px] font-semibold leading-tight text-white">{label}</span>
    </button>
  );

  return (
    <div className="relative isolate -mx-4 -mt-2 min-h-[100dvh] pb-28">
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

      {/* Top bar: avatar, centred greeting, then search and alerts */}
      <header className="sticky top-0 z-30 -mx-4 flex items-center gap-3 bg-black/55 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <GlossyBall className="h-12 w-12 shrink-0">
          <span className="-skew-x-12 text-[20px] font-black leading-none [text-shadow:0_2px_3px_rgba(0,0,0,0.45)]">
            {initials(data.customer.name).slice(0, 1)}
          </span>
        </GlossyBall>
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold text-white">
          Hello {firstName} 👋
        </h1>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => jump(cardsRef)}
            className="text-white transition-transform active:scale-90"
            aria-label="Search packages"
          >
            <Search className="h-6 w-6" strokeWidth={1.9} aria-hidden />
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-white transition-transform active:scale-90"
            aria-label="Sign out"
          >
            <UserCog className="h-6 w-6" strokeWidth={1.9} aria-hidden />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        {/* Green pill tabs */}
        <div className="flex items-center gap-6">
          {(
            [
              { id: 'package', label: 'Package' },
              { id: 'payments', label: 'Payments' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={cn(
                'flex h-11 items-center rounded-full px-8 text-[15px] font-bold transition-transform active:scale-[0.98]',
                tab === t.id ? 'text-white shadow-lg' : 'text-white/70',
              )}
              style={tab === t.id ? { background: GREEN, boxShadow: '0 8px 20px -8px rgba(139,197,63,0.9)' } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'package' ? (
          <>
            {/* Section head */}
            <div className="mt-5 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => jump(cardsRef)}
                className="flex items-center gap-1.5 text-[13px] font-semibold underline underline-offset-4"
                style={{ color: GREEN }}
              >
                <Wifi className="h-4 w-4" aria-hidden />
                Change package
              </button>
              <button type="button" onClick={() => jump(cardsRef)} className="text-[13px] font-medium text-white">
                View All
              </button>
            </div>

            {/* Package cards, swiped sideways */}
            <div
              ref={cardsRef}
              className="scrollbar-none -mx-4 mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4"
            >
              {data.packages.map((p) => {
                const mine = p.id === current?.id;
                const days = mine && sub ? sub.daysLeft : (p.billingDays ?? 30);
                return (
                  <article
                    key={p.id}
                    className="w-[82vw] max-w-[330px] shrink-0 snap-center rounded-[24px] border border-white/20 p-5 text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)]"
                    style={{ background: `linear-gradient(135deg, ${CARD_FROM} 0%, ${CARD_MID} 55%, ${CARD_TO} 100%)` }}
                  >
                    <p className="text-[13px] text-white/80">{mine ? 'My WiFi package' : 'Available package'}</p>
                    <p className="mt-1 text-[13px] font-semibold uppercase tracking-wide text-white/90">
                      {data.customer.name}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <p className="text-[17px] font-medium tabular-nums">
                        {showNumber ? accountNo || '—' : accountNo ? '••••••••••' : '—'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (accountNo) {
                            void navigator.clipboard?.writeText(accountNo);
                            notifySuccess('Number copied', accountNo);
                          }
                        }}
                        className="text-white/80 active:scale-90"
                        aria-label="Copy number"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <p className="h-6 w-28 rounded bg-white/15 blur-[3px]" aria-hidden />
                      <button
                        type="button"
                        onClick={() => setShowNumber((v) => !v)}
                        className="text-white/80 active:scale-90"
                        aria-label={showNumber ? 'Hide balance' : 'Show balance'}
                      >
                        <EyeOff className="h-5 w-5" aria-hidden />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <PillButton
                        onClick={() => {
                          setTab('payments');
                          window.setTimeout(() => jump(paymentsRef), 60);
                        }}
                      >
                        <Receipt className="h-4 w-4" aria-hidden />
                        Statement
                      </PillButton>
                      <PillButton onClick={() => setPayFor(p)}>
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        {mine && sub?.status !== 'ACTIVE' ? 'Renew' : 'Deposit'}
                      </PillButton>
                    </div>

                    <p className="mt-3 text-[12px] text-white/70">
                      {p.speedMbps ? `${p.speedMbps} Mbps · ` : ''}
                      {days} days · {formatKES(p.price)}
                      {mine && <span className="ml-1 font-semibold" style={{ color: GREEN }}>· My package</span>}
                    </p>
                  </article>
                );
              })}
            </div>

            {/* Carousel dots */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {data.packages.map((p) => (
                <span
                  key={p.id}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: p.id === current?.id ? 22 : 6, background: p.id === current?.id ? GREEN : 'rgba(255,255,255,0.55)' }}
                  aria-hidden
                />
              ))}
            </div>

            {/* Days-left strip */}
            <Panel className="mt-5 flex items-center gap-3 px-4 py-3.5">
              <p className="text-[14px] font-medium text-white/90">
                Days left:{' '}
                <span className="font-bold text-white">{sub ? Math.max(0, sub.daysLeft) : '—'}</span>
              </p>
              <span className="h-3 w-20 rounded bg-white/25 blur-[2px]" aria-hidden />
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => current && setPayFor(current)}
                className="flex items-center gap-2 text-[13px] font-semibold text-white"
              >
                {sub?.status === 'EXPIRED' ? 'Renew now' : 'Pay early'}
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ border: `2px solid ${GREEN}` }}
                >
                  <ArrowRight className="h-4 w-4" style={{ color: GREEN }} aria-hidden />
                </span>
              </button>
              {sub && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(3, left * 100)}%`, background: status?.bar }} />
                </div>
              )}
            </Panel>

            {/* Quick actions */}
            <div ref={actionsRef}>
              <Panel className="mt-5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-[17px] font-bold text-white">Quick Actions</h2>
                  <button
                    type="button"
                    onClick={() => jump(cardsRef)}
                    className="h-9 rounded-full border-2 px-5 text-[13px] font-bold"
                    style={{ borderColor: GREEN, color: GREEN }}
                  >
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-y-4">
                  {current && action(Smartphone, 'Pay with M-Pesa', () => setPayFor(current))}
                  {action(PackageIcon, 'Packages', () => jump(cardsRef))}
                  {action(Receipt, 'Receipts', () => {
                    setTab('payments');
                    window.setTimeout(() => jump(paymentsRef), 60);
                  })}
                  {data.business.phone &&
                    action(UserCog, 'Call us', () => {
                      window.location.href = `tel:${data.business.phone}`;
                    })}
                  {data.business.phone &&
                    action(WhatsAppIcon, 'WhatsApp', () => {
                      window.open(`https://wa.me/${phoneDigits}`, '_blank');
                    })}
                  {action(Home, 'My details', () => setShowNumber((v) => !v))}
                </div>
              </Panel>
            </div>
          </>
        ) : (
          /* Payments tab */
          <div ref={paymentsRef} className="mt-5">
            <Panel className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-white">My payments</h2>
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

            {/* Help */}
            {data.business.phone && (
              <Panel className="mt-4 p-4">
                <h2 className="text-[17px] font-bold text-white">Need help with your WiFi?</h2>
                <p className="mt-0.5 text-[12px] text-white/75">Call or message {data.business.name}.</p>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <PillButton onClick={() => window.location.assign(`tel:${data.business.phone}`)}>
                    Call
                  </PillButton>
                  <PillButton onClick={() => window.open(`https://wa.me/${phoneDigits}`, '_blank')}>
                    <WhatsAppIcon className="h-4 w-4" aria-hidden />
                    WhatsApp
                  </PillButton>
                </div>
              </Panel>
            )}
          </div>
        )}
      </div>

      {/* Floating bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-black/70 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 px-2">
          {(
            [
              { label: 'Home', icon: Home, active: true, onClick: () => jump(topRef) },
              { label: 'Pay', icon: Smartphone, active: false, onClick: () => current && setPayFor(current) },
              { label: 'Packages', icon: PackageIcon, active: false, onClick: () => jump(cardsRef) },
              {
                label: 'Payments',
                icon: Receipt,
                active: false,
                onClick: () => {
                  setTab('payments');
                  window.setTimeout(() => jump(paymentsRef), 60);
                },
              },
              {
                label: 'Help',
                icon: UserCog,
                active: false,
                onClick: () => {
                  setTab('payments');
                  window.setTimeout(() => jump(paymentsRef), 60);
                },
              },
            ] as { label: string; icon: LucideIcon; active: boolean; onClick: () => void }[]
          ).map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={t.onClick}
              className="flex flex-col items-center gap-1 py-1 transition-transform active:scale-90"
            >
              <t.icon
                className="h-6 w-6"
                strokeWidth={1.9}
                style={{ color: t.active ? GREEN : 'rgba(255,255,255,0.75)' }}
                aria-hidden
              />
              <span
                className={cn('text-[11px] font-semibold', t.active ? '' : 'text-white/75')}
                style={t.active ? { color: GREEN } : undefined}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

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