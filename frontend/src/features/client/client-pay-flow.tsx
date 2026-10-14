import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { clientApi, type ClientHome, type StkPush } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';
import { formatDate, formatKES } from '@/lib/utils';
import { ClientShell, useClientHome } from './client-pages';

type Pkg = ClientHome['packages'][number];

/** How long the client has to enter their M-Pesa PIN before the countdown stops. */
const PIN_SECONDS = 60;

/** What the client is being charged per day on this package. */
function dayRate(pkg: Pkg): number {
  return pkg.price / (pkg.billingDays ?? 30);
}

/** The M-Pesa wordmark, on a white tile like the reference's method logo. */
function MPesaMark() {
  return (
    <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-[0_6px_16px_-10px_rgba(0,0,0,0.8)]">
      <img src="/images/mpesa.jpg" alt="M-Pesa" className="h-full w-full object-contain" />
    </span>
  );
}

/** One tappable amount on the "Payment amount" page. */
function AmountRow({
  title,
  hint,
  hintMuted,
  selected,
  onSelect,
}: {
  title: string;
  hint: string;
  hintMuted?: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        'w-full rounded-2xl border p-4 text-left transition-transform active:scale-[0.99] ' +
        (selected
          ? 'border-white/80 bg-white/20 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.8)]'
          : 'border-white/15 bg-black/55 backdrop-blur-md')
      }
      aria-pressed={selected}
    >
      <span className="block text-[17px] font-semibold text-white">{title}</span>
      <span className={hintMuted ? 'mt-0.5 block text-[13px] text-white/60' : 'mt-0.5 block text-[13px] text-white/80'}>
        {hint}
      </span>
    </button>
  );
}

/**
 * Step 1 of paying: what the client is paying for. The package's daily rate is the
 * quick pick; a custom amount lets them pay part of it. Whatever they choose
 * carries to the "Choose how to pay" page.
 */
export function ClientAmountPage() {
  const { home, isLoading } = useClientHome();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<{ amount: number; label: string } | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  if (isLoading || !home) return <WorkspaceLoader />;

  const mine = home.subscription?.productId ?? null;
  const pkg =
    home.packages.find((p) => p.id === params.get('pkg')) ?? home.packages.find((p) => p.id === mine) ?? null;

  if (!pkg) {
    return (
      <ClientShell title="">
        <h1 className="text-[26px] font-bold text-white">Payment amount</h1>
        <p className="mt-4 rounded-2xl border border-white/15 bg-black/55 p-4 text-[14px] text-white/80 backdrop-blur-md">
          You don't have a WiFi package yet. Pick one first and you can pay for it here.
        </p>
        <button
          type="button"
          onClick={() => navigate('/my-packages')}
          className="mt-4 h-12 w-full rounded-xl bg-[#8BC53F] text-[15px] font-semibold text-white"
        >
          Browse packages
        </button>
      </ClientShell>
    );
  }

  const rate = dayRate(pkg);
  const days = pkg.billingDays ?? 30;
  const caps = [1, 7, 14, days]
    .filter((d, i, all) => all.indexOf(d) === i && d > 0)
    .map((d) => ({ days: d, amount: Math.min(Math.round(rate * d), pkg.price) }))
    .filter((c) => c.amount > 0);

  const custom = Number(customAmount);
  const customValid = Number.isFinite(custom) && custom >= 1 && custom <= pkg.price;
  const locks = home.subscription
    ? `Renews on ${formatDate(home.subscription.expiresAt)} · ${home.subscription.daysLeft} days left`
    : `Starts a new ${days}-day package`;

  const continueTo = () => {
    if (!picked) return;
    navigate(`/my-method?pkg=${pkg.id}&amount=${Math.round(picked.amount)}`);
  };

  return (
    <ClientShell title="">
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
        <h1 className="text-[26px] font-bold leading-tight text-white">Payment amount</h1>

        <div className="mt-4 space-y-3">
          <AmountRow
            title={`${formatKES(Math.round(rate))} / Day`}
            hint={`${locks}`}
            hintMuted
            selected={picked?.label === 'rate'}
            onSelect={() => setPicked({ amount: pkg.price, label: 'rate' })}
          />
          <AmountRow
            title="Custom amount"
            hint={picked?.label === 'custom' ? formatKES(picked.amount) : 'Tap here to select'}
            hintMuted={picked?.label !== 'custom'}
            selected={picked?.label === 'custom'}
            onSelect={() => setCustomOpen(true)}
          />
        </div>

        <p className="mt-4 px-1 text-[12px] text-white/65">
          {pkg.name.replace(/\s*\d+\s*mbps\s*$/i, '') || pkg.name} is {formatKES(pkg.price)} for {days} days.
        </p>

        {/* Pinned to the bottom, like the reference */}
        <div className="mt-auto bg-gradient-to-t from-black/85 to-transparent px-1 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
          <button
            type="button"
            onClick={continueTo}
            disabled={!picked}
            className="h-14 w-full rounded-xl bg-[#8BC53F] text-[15px] font-semibold text-white transition-opacity disabled:bg-white/15 disabled:text-white/60"
          >
            Continue
          </button>
        </div>
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen} title="Custom amount" description={`${formatKES(1)} to ${formatKES(pkg.price)}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {caps.map((c) => (
              <button
                key={c.days}
                type="button"
                onClick={() => setCustomAmount(String(c.amount))}
                className="rounded-xl border border-edge-2 bg-surface-2 px-3 py-3 text-left"
              >
                <span className="block text-[13px] font-medium text-foreground">
                  {c.days} {c.days === 1 ? 'day' : 'days'}
                </span>
                <span className="block text-[12px] text-foreground-4">{formatKES(c.amount)}</span>
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="client-custom-amount" className="mb-1 block text-[12px] font-medium text-foreground-3">
              Amount in KSh
            </label>
            <Input
              id="client-custom-amount"
              type="number"
              inputMode="numeric"
              min={1}
              max={pkg.price}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={String(Math.round(rate))}
            />
          </div>

          <button
            type="button"
            disabled={!customValid}
            onClick={() => {
              setPicked({ amount: Math.round(custom), label: 'custom' });
              setCustomOpen(false);
            }}
            className="h-14 w-full rounded-2xl bg-[#8BC53F] text-[15px] font-semibold text-white disabled:opacity-50"
          >
            Use this amount
          </button>
        </div>
      </Dialog>
    </ClientShell>
  );
}

/**
 * Step 2 of paying: the M-Pesa prompt. Sending it shows the "push sent" message,
 * then the page counts down and watches for the payment to land.
 */
export function ClientMethodPage() {
  const { home, isLoading } = useClientHome();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [phone, setPhone] = useState('');
  const [push, setPush] = useState<(StkPush & { saleId?: string | null }) | null>(null);
  const [sentOpen, setSentOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(PIN_SECONDS);

  // Prefill the M-Pesa number once the account arrives
  useEffect(() => {
    if (home && phone === '') setPhone(home.customer.phone ?? '');
  }, [home, phone]);

  const pkg = home?.packages.find((p) => p.id === params.get('pkg')) ?? null;
  const amount = Math.max(1, Math.round(Number(params.get('amount')) || pkg?.price || 0));

  // Countdown while the client types their PIN
  useEffect(() => {
    if (push?.state !== 'pending') return;
    const timer = window.setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [push?.state]);

  // Watch for the payment, then record it once
  useEffect(() => {
    if (push?.state !== 'pending') return;
    const timer = window.setInterval(async () => {
      try {
        const next = await clientApi.payStatus(push.checkoutRequestId);
        setPush(next);
        if (next.state === 'paid') {
          setLeft(0);
          await queryClient.invalidateQueries({ queryKey: ['client-me'] });
        }
      } catch {
        setPush({ ...push });
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [push, queryClient]);

  if (isLoading || !home) return <WorkspaceLoader />;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const next = await clientApi.pay({ productId: pkg?.id, phone, amount });
      setPush(next);
      setLeft(PIN_SECONDS);
      setSentOpen(true);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const paid = push?.state === 'paid';

  return (
    <ClientShell title="">
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col">
        <h1 className="text-[26px] font-bold leading-tight text-white">Choose how to pay</h1>

        {paid ? (
          /* Paid: the renewal is recorded, so the client is done */
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-white/15 bg-black/55 px-5 py-8 text-center backdrop-blur-md">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
              <CheckCircle2 className="h-9 w-9 text-emerald-300" aria-hidden />
            </span>
            <p className="text-[20px] font-semibold text-white">Payment received</p>
            <p className="text-[13px] text-white/75">
              You paid {formatKES(amount)} for {pkg?.name.replace(/\s*\d+\s*mbps\s*$/i, '') || 'your package'}.
              {push?.receipt ? ` M-Pesa ${push.receipt}.` : ''}
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-2 h-12 w-full rounded-xl bg-[#8BC53F] text-[15px] font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* What this payment is for */}
            <section className="mt-4 rounded-2xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-md">
              <p className="text-[13px] text-white/70">You are paying</p>
              <p className="text-[20px] font-semibold text-white">{formatKES(amount)}</p>
            </section>

            <h2 className="mt-5 px-1 text-[13px] font-medium text-white/70">Mobile money</h2>
            <div className="mt-2 flex items-center gap-4 rounded-2xl border-2 border-[#8BC53F] bg-white/10 p-4">
              <MPesaMark />
              <div>
                <p className="text-[15px] font-semibold text-white">M-Pesa</p>
                <p className="text-[12px] text-white/65">Pay from your M-Pesa wallet</p>
              </div>
            </div>

            <section className="mt-5 rounded-2xl border border-white/15 bg-black/55 p-4 backdrop-blur-md">
              <h3 className="text-[15px] font-semibold text-white">Pay with M-Pesa</h3>
              <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-white/80">
                <li className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>Confirm the mobile phone number registered with <b className="font-semibold text-white">M-Pesa</b>.</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>
                    Tap <b className="font-semibold text-white">Send M-Pesa Prompt</b> to trigger a payment request to that phone.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>
                    On the phone, enter your <b className="font-semibold text-white">M-Pesa PIN</b> to confirm and authorise the payment.
                  </span>
                </li>
              </ul>

              <label htmlFor="client-mpesa-phone" className="mt-4 block text-[13px] font-semibold text-white">
                Phone Number
              </label>
              <Input
                id="client-mpesa-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="mt-1 !bg-white/10 !text-white placeholder:!text-white/50"
              />
              <p className="mt-1 px-1 text-[11px] text-white/55">The prompt goes to this number.</p>
            </section>

            {error && (
              <div className="mt-4">
                <Alert variant="error" inline>
                  {error}
                </Alert>
              </div>
            )}

            <div className="mt-auto space-y-3 bg-gradient-to-t from-black/85 to-transparent px-1 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
              <button
                type="button"
                onClick={send}
                disabled={sending || push?.state === 'pending' || !phone.trim()}
                className="h-14 w-full rounded-xl bg-[#8BC53F] text-[15px] font-semibold text-white disabled:opacity-60"
              >
                {sending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending…
                  </span>
                ) : push?.state === 'pending' ? (
                  <span className="inline-flex items-center gap-2">
                    <Smartphone className="h-4 w-4" aria-hidden />
                    Waiting for your PIN
                </span>
              ) : (
                'Send M-Pesa Prompt'
              )}
            </button>

            {push?.state === 'pending' && (
              <button
                type="button"
                onClick={() => {
                  setPush(null);
                  setError(null);
                }}
                className="w-full py-2 text-[12px] text-white/70 active:opacity-70"
              >
                Use a different number or send again
              </button>
            )}

            {push?.state === 'pending' && (
              <p className="text-center text-[13px] text-white/75">
                {left > 0 ? `Pay in ${left} s` : 'Still waiting — enter your PIN on your phone.'}
              </p>
            )}
          </div>
        </>
      )}
      </div>

      {/* "Push sent" confirmation; behind it the countdown keeps ticking */}
      <Dialog
        open={sentOpen}
        onOpenChange={setSentOpen}
        title="USSD push sent successfully"
        description="Pay by entering your PIN"
      >
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/20">
            <CheckCircle2 className="h-11 w-11 text-emerald-400" aria-hidden />
          </span>
          <button
            type="button"
            onClick={() => setSentOpen(false)}
            className="h-14 w-full rounded-2xl bg-[#0033A1] text-[15px] font-semibold text-white"
          >
            OK
          </button>
        </div>
      </Dialog>
    </ClientShell>
  );
}