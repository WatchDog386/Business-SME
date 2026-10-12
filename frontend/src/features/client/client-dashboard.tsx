import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, Loader2, LogOut, Phone, Receipt, Smartphone, Wifi } from 'lucide-react';
import { clientApi, type ClientHome, type StkPush } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';
import { CARD_THEMES, FiberHeroCard } from '@/components/brand/fiber-card';
import { WhatsAppIcon } from '@/components/brand/whatsapp-icon';
import { planStyle } from '@/features/products/package-card';
import { useAuthStore } from '@/stores/auth';
import { cn, formatDate, formatKES } from '@/lib/utils';

type Pkg = ClientHome['packages'][number];

const STATUS = {
  ACTIVE: { label: 'Connected', cls: 'bg-emerald-100 text-emerald-700 [.dark_&]:bg-emerald-500/15 [.dark_&]:text-emerald-300', bar: '#2DA043' },
  EXPIRING: { label: 'Expiring soon', cls: 'bg-amber-100 text-amber-700 [.dark_&]:bg-amber-500/15 [.dark_&]:text-amber-300', bar: '#F08C21' },
  EXPIRED: { label: 'Expired', cls: 'bg-red-100 text-red-700 [.dark_&]:bg-red-500/15 [.dark_&]:text-red-300', bar: '#E23B41' },
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Client dashboard: a WiFi client's own app. Their package and days left,
 * pay or renew with an M-Pesa prompt, switch package, download receipts and
 * get help. They never see anything of the business beyond this.
 */
export function ClientDashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [payFor, setPayFor] = useState<Pkg | null>(null);
  const { data, isLoading, error } = useQuery({ queryKey: ['client-me'], queryFn: clientApi.me });

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
  // Share of the 30-day period left, for the bar
  const period = current?.billingDays ?? 30;
  const left = sub ? Math.max(0, Math.min(1, sub.daysLeft / period)) : 0;
  const phoneDigits = (data.business.phone ?? '').replace(/\D/g, '').replace(/^0/, '254');

  return (
    <div className="relative isolate space-y-6 pb-10">
      <div className="dash-glow pointer-events-none absolute -left-4 -right-4 top-0 -z-10 h-80" aria-hidden />

      <header className="page-head dash-glow-head flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3A8F91] to-[#2F7F81] text-[14px] font-semibold text-white ring-2 ring-white">
            {initials(data.customer.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[12px] text-foreground-4">{data.business.name}</span>
            <span className="block truncate text-[18px] font-semibold text-foreground">Hello, {firstName} 👋</span>
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-foreground active:scale-90"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* My package: the bank card, with Pay / Renew in its corner */}
      {sub && current ? (
        <FiberHeroCard
          theme={sub.status === 'EXPIRED' ? CARD_THEMES.expenses : CARD_THEMES.sales}
          label="My WiFi package"
          value={current.name.replace(/\s*\d+\s*mbps\s*$/i, '')}
          note={current.speedMbps ? `${current.speedMbps} Mbps` : undefined}
          maskedValue={sub.daysLeft > 0 ? sub.daysLeft : 0}
          footerLeft={data.customer.name}
          footerRight={`${sub.status === 'EXPIRED' ? 'Ended' : 'Until'} ${formatDate(sub.expiresAt)}`}
          icon={Wifi}
          action={{ label: sub.status === 'ACTIVE' ? 'Pay early' : 'Renew now', onClick: () => setPayFor(current) }}
        />
      ) : (
        <div className="rounded-[28px] bg-[#DDEAF3] p-5 [.dark_&]:bg-[#1C2A33]">
          <p className="text-[18px] font-semibold text-foreground">No WiFi package yet</p>
          <p className="mt-1 text-[13px] text-foreground-3">Pick a package below and pay with M-Pesa to get connected.</p>
        </div>
      )}

      {/* Days left */}
      {sub && status && (
        <section className="rounded-[28px] bg-[#E4E7F1] p-4 [.dark_&]:bg-[#23263A]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-foreground-4">
              Started {formatDate(sub.startedAt)} · {sub.renewals} renewal{sub.renewals === 1 ? '' : 's'}
            </span>
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', status.cls)}>{status.label}</span>
          </div>
          <div className="mb-3 mt-1 flex items-baseline justify-between gap-2">
            <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
              {sub.daysLeft > 0 ? 'Days left' : sub.daysLeft === 0 ? 'Ends today' : 'Expired'}
            </h2>
            <span className="text-[28px] font-semibold tabular-nums text-foreground">
              {Math.max(0, sub.daysLeft)}
              <span className="ml-1 text-[12px] font-medium text-foreground-4">of {period}</span>
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white [.dark_&]:bg-black/30">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(3, left * 100)}%`, background: status.bar }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Tile label="Monthly price" value={formatKES(current?.price ?? sub.price)} />
            <Tile
              label={data.customer.balance > 0 ? 'You owe' : 'Balance'}
              value={data.customer.balance > 0 ? formatKES(data.customer.balance) : 'All paid'}
              danger={data.customer.balance > 0}
            />
          </div>
        </section>
      )}

      {/* Switch package */}
      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{sub ? 'Change package' : 'Choose a package'}</h2>
          <span className="text-[12px] text-foreground-4">Pay with M-Pesa</span>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4">
          {data.packages.map((p, i) => {
            const style = planStyle(p.name.replace(/\s*\d+\s*mbps\s*$/i, ''), i);
            const mine = p.id === current?.id;
            return (
              <div key={p.id} className="flex w-40 shrink-0 flex-col rounded-3xl bg-[#F2F2F4] p-4 [.dark_&]:bg-[#1E1E1E]">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
                >
                  {p.speedMbps ? `${p.speedMbps}M` : <Wifi className="h-5 w-5" />}
                </span>
                <p className="mt-3 text-[15px] font-medium text-foreground">{p.name.replace(/\s*\d+\s*mbps\s*$/i, '')}</p>
                <p className="text-[12px] text-foreground-4">
                  {p.speedMbps ? `${p.speedMbps} Mbps · ` : ''}
                  {p.billingDays ?? 30} days
                </p>
                <button
                  type="button"
                  onClick={() => setPayFor(p)}
                  className="mt-3 h-10 rounded-xl border-[1.5px] text-[13px] font-medium tabular-nums"
                  style={mine ? { background: style.from, borderColor: style.from, color: '#fff' } : { borderColor: style.from, color: style.from }}
                >
                  {mine ? 'My package · Pay' : `KSh ${p.price.toLocaleString('en-KE')}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payments and receipts */}
      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">My payments</h2>
          <span className="text-[12px] text-foreground-4">{data.payments.length}</span>
        </div>
        {data.payments.length === 0 ? (
          <p className="px-1 text-[13px] text-foreground-4">No payments yet.</p>
        ) : (
          <ul className="space-y-1">
            {data.payments.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </ul>
        )}
      </section>

      {/* Help */}
      {data.business.phone && (
        <section className="rounded-[28px] bg-[#DDEBD9] p-4 [.dark_&]:bg-[#1D2B22]">
          <p className="text-[15px] font-semibold text-foreground">Need help with your WiFi?</p>
          <p className="mt-0.5 text-[12px] text-foreground-3">Call or message {data.business.name}.</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <a href={`tel:${data.business.phone}`} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-[13px] font-semibold text-foreground [.dark_&]:bg-black/30">
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={`https://wa.me/${phoneDigits}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-[13px] font-semibold text-white"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </section>
      )}

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

function Tile({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-3 [.dark_&]:bg-black/30">
      <p className="text-[11px] text-foreground-4">{label}</p>
      <p className={cn('mt-1 text-[17px] font-semibold tabular-nums', danger ? 'text-danger' : 'text-foreground')}>{value}</p>
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
    <li className="flex items-center gap-3 px-1 py-2">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F3F3] text-[#2F7F81] [.dark_&]:bg-white/10 [.dark_&]:text-[#7CC3C4]">
        <Receipt className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold tabular-nums text-foreground">{formatKES(payment.total)}</span>
        <span className="block truncate text-[12px] text-foreground-4">
          {formatDate(payment.at)} · {payment.method === 'M-PESA' ? 'M-Pesa' : payment.method.toLowerCase()}
          {!paid ? ' · unpaid' : ''}
        </span>
      </span>
      <button
        type="button"
        onClick={() => get(paid ? 'receipt' : 'invoice')}
        disabled={busy !== null}
        className="flex h-9 items-center gap-1.5 rounded-full bg-surface-3 px-3 text-[12px] font-semibold text-foreground active:scale-95 disabled:opacity-60"
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
