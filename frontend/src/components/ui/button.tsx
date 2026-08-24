import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'success';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-accent text-white hover:bg-accent-strong shadow-sm active:scale-[0.98]',
  secondary: 'bg-surface-3 text-foreground-2 hover:bg-edge',
  outline:
    'border border-edge bg-surface text-foreground-2 hover:border-accent-border hover:text-accent hover:bg-accent-soft',
  ghost: 'text-foreground-3 hover:bg-surface-2',
  destructive: 'bg-danger text-white hover:bg-danger-strong',
  success:
    'bg-success text-white hover:bg-success-strong shadow-sm active:scale-[0.98]',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-11 px-5 text-sm',
  sm: 'h-9 px-3.5 text-sm',
  lg: 'h-[52px] px-6 text-sm',
  icon: 'h-11 w-11',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', loading, children, disabled, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';