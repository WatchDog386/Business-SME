import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const config: Record<
  AlertVariant,
  { icon: typeof Info; classes: string; iconClass: string }
> = {
  info: {
    icon: Info,
    classes: 'border-info-border bg-info-soft text-info-text',
    iconClass: 'text-info',
  },
  success: {
    icon: CheckCircle2,
    classes: 'border-success-border bg-success-soft text-success-text',
    iconClass: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-warning-border bg-warning-soft text-warning-text',
    iconClass: 'text-warning',
  },
  error: {
    icon: XCircle,
    classes: 'border-danger-border bg-danger-soft text-danger-text',
    iconClass: 'text-danger',
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
  const { icon: Icon, classes, iconClass } = config[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        classes,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconClass)} aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  );
}