import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-11 w-full rounded-full border border-edge bg-surface px-4 text-sm text-foreground shadow-sm placeholder:text-foreground-5',
        'transition-all duration-150 hover:border-edge-2 focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-surface-2',
        'aria-[invalid=true]:border-danger focus:aria-[invalid=true]:ring-danger/20',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';