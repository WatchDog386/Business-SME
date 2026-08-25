import { CheckCircle2 } from 'lucide-react';
import type { SubscriptionPayment } from '@/api/types';
import { cn } from '@/lib/utils';

export const METHOD_LABELS: Record<string, string> = {
  MPESA: 'M-Pesa',
  CARD: 'Card',
  BANK: 'Bank transfer',
  PAYPAL: 'PayPal',
};

export function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}

export const STATUS_TONES: Record<string, string> = {
  PAID: 'bg-success-soft text-success',
  PENDING: 'bg-warning-soft text-warning',
  FAILED: 'bg-danger-soft text-danger',
};

export function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-4 shadow-soft transition-shadow hover:shadow-lift">
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg',
          tone,
        )}
      >
        {icon}
      </span>
      <p className="mt-2.5 truncate text-xl font-medium leading-none tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] font-medium text-foreground-4">
        {label}
      </p>
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5">
      <h1 className="text-lg font-medium tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-0.5 text-[13px] text-foreground-3">{subtitle}</p>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-soft">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3">
          <h2 className="text-[13px] font-medium tracking-tight text-foreground">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-4 py-8 text-center text-xs text-foreground-4">
      {children}
    </li>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        STATUS_TONES[status] ?? 'bg-surface-3 text-foreground-4',
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function PaymentLine({
  payment,
  action,
}: {
  payment: SubscriptionPayment;
  action?: React.ReactNode;
}) {
  const dateLabel = new Date(
    payment.paid_at ?? payment.created_at,
  ).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2/60">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-3">
          {(METHOD_LABELS[payment.method] ?? payment.method)
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium tabular-nums text-foreground">
            {formatKES(payment.amount)}
            <span className="ml-1.5 font-normal text-foreground-4">
              · {METHOD_LABELS[payment.method] ?? payment.method} ·{' '}
              {payment.plan.charAt(0) + payment.plan.slice(1).toLowerCase()}
            </span>
          </p>
          <p className="truncate text-[11px] text-foreground-5">
            {payment.payer_email ?? payment.reference} · {dateLabel}
          </p>
        </div>
      </div>
      {action ?? <StatusPill status={payment.status} />}
    </div>
  );
}

export function ConfirmButton({
  onClick,
  busy,
}: {
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-accent px-3 text-xs font-medium text-white shadow-sm transition-all hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60"
    >
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      Confirm received
    </button>
  );
}
