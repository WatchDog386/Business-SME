import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Inline success / error / info messages. Built on the Log Out confirmation's
 * design — white rounded card with a soft shadow, a round icon tile and a bold
 * title — so every message in the app matches that popup.
 */
const config: Record<
  AlertVariant,
  { icon: typeof Info; tile: string; label: string }
> = {
  info: {
    icon: Info,
    tile: 'bg-[#2F6FB5]/10 text-[#2F6FB5]',
    label: 'Information',
  },
  success: {
    icon: CheckCircle2,
    tile: 'bg-[#7CB82F]/12 text-[#7CB82F]',
    label: 'Success',
  },
  warning: {
    icon: AlertTriangle,
    tile: 'bg-amber-100 text-amber-600 [.dark_&]:bg-amber-500/15 [.dark_&]:text-amber-400',
    label: 'Warning',
  },
  error: {
    icon: XCircle,
    tile: 'bg-red-100 text-red-600 [.dark_&]:bg-red-500/15 [.dark_&]:text-red-400',
    label: 'Error',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, tile, label } = config[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-label={label}
      className={cn(
        'flex items-start gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5 [.dark_&]:bg-[#1E1E1E] [.dark_&]:ring-white/10',
        className,
      )}
    >
      <span
        className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', tile)}
        aria-hidden
      >
        <Icon className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {title && (
          <p className="text-[15px] font-semibold leading-snug text-slate-900 [.dark_&]:text-white">
            {title}
          </p>
        )}
        {children && (
          <div
            className={cn(
              'text-[13.5px] leading-relaxed text-slate-700 [.dark_&]:text-slate-300',
              title && 'mt-1',
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}