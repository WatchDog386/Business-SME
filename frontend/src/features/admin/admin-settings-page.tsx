import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  CreditCard,
  KeyRound,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { adminApi, authApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PageTitle, SectionCard, formatKES } from './admin-shared';

export function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.settings,
  });

  return (
    <div className="max-w-2xl space-y-5">
      <PageTitle
        title="Settings"
        subtitle="Your owner account and platform configuration."
      />

      {/* Owner account */}
      <SectionCard title="Owner account">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-base font-semibold uppercase text-white">
              {(user?.fullName || '?').charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">
                {user?.fullName}
              </p>
              <p className="flex items-center gap-1 truncate text-xs text-foreground-4">
                <Mail className="h-3 w-3 shrink-0" aria-hidden />
                {user?.email}
              </p>
            </div>
          </div>
          <ChangePasswordForm />
        </div>
      </SectionCard>

      {/* Payment gateway */}
      <SectionCard title="Payment gateway">
        <div className="px-4 py-4">
          {settingsQuery.isLoading ? (
            <Skeleton className="h-12 rounded-xl" />
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="flex items-center gap-2 text-[13px] text-foreground-2">
                  <CreditCard
                    className="h-4 w-4 text-foreground-5"
                    aria-hidden
                  />
                  Paystack
                </span>
                {settingsQuery.data?.paystackConfigured ? (
                  <span className="flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    Live
                  </span>
                ) : (
                  <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                    Demo mode
                  </span>
                )}
              </div>
              {!settingsQuery.data?.paystackConfigured && (
                <p className="px-1 text-[11px] leading-relaxed text-foreground-4">
                  To collect real money: add{' '}
                  <code className="rounded bg-surface-2 px-1 font-mono text-[11px]">
                    PAYSTACK_SECRET_KEY
                  </code>{' '}
                  to backend/.env, your public key in lib/paystack.ts, then set
                  the webhook URL to /api/v1/webhooks/paystack in your Paystack
                  dashboard.
                </p>
              )}
              <p className="px-1 text-[11px] leading-relaxed text-foreground-4">
                M-Pesa, Card and Bank charges settle into your Paystack balance.
                PayPal invoices are confirmed manually under Payments.
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Plans & pricing */}
      <SectionCard title="Plans & pricing">
        <ul className="grid grid-cols-3 gap-2.5 px-4 py-4">
          {(settingsQuery.data?.plans ?? []).map((plan) => (
            <li
              key={plan.id}
              className="rounded-xl border border-edge bg-surface-2 px-3 py-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                {plan.id}
              </p>
              <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                {plan.price === 0 ? 'Free' : formatKES(plan.price)}
              </p>
              <p className="text-[10px] text-foreground-5">per month</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Admin access */}
      <SectionCard title="Admin access">
        <div className="px-4 py-4">
          <p className="text-[11px] leading-relaxed text-foreground-4">
            Accounts allowed into this console — configured via{' '}
            <code className="rounded bg-surface-2 px-1 font-mono text-[11px]">
              ADMIN_EMAILS
            </code>{' '}
            in backend/.env.
          </p>
          <ul className="mt-3 space-y-2">
            {(settingsQuery.data?.adminEmails ?? []).map((email) => (
              <li
                key={email}
                className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px] text-foreground-2"
              >
                <ShieldCheck
                  className="h-4 w-4 shrink-0 text-accent"
                  aria-hidden
                />
                <span className="truncate">{email}</span>
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: () => {
      setDone(true);
      setCurrent('');
      setNext('');
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    mutation.mutate();
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 space-y-3 border-t border-edge pt-4"
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-4">
        <KeyRound className="h-3.5 w-3.5" aria-hidden />
        Change password
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      {done && (
        <Alert variant="success" title="Password updated">
          Use your new password next time you log in.
        </Alert>
      )}
      <div>
        <Label htmlFor="admin-current" className="text-xs">
          Current password
        </Label>
        <input
          id="admin-current"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1 h-10 w-full rounded-full border border-edge bg-field px-4 text-sm outline-none focus:border-edge-2 focus:ring-0"
        />
      </div>
      <div>
        <Label htmlFor="admin-next" className="text-xs">
          New password
        </Label>
        <input
          id="admin-next"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          required
          className="mt-1 h-10 w-full rounded-full border border-edge bg-field px-4 text-sm outline-none focus:border-edge-2 focus:ring-0"
        />
      </div>
      <Button type="submit" size="sm" loading={mutation.isPending}>
        Update password
      </Button>
    </form>
  );
}
