import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Screen app bar in the Safaricom app style: round back button on the left,
 * centred title, optional action on the right. Pinned on phones via `page-head`.
 */
export function AppBar({
  title,
  onBack,
  right,
  className,
}: {
  title: string;
  /** Defaults to going back, or to the dashboard when there's no history. */
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  const goBack = onBack ?? (() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard')));

  return (
    <div className={cn('page-head grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-2', className)}>
      <div className="justify-self-start">
        <AppBarButton onClick={goBack} aria-label="Back">
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </AppBarButton>
      </div>
      <h1 className="max-w-[52vw] truncate text-center text-[17px] font-medium tracking-tight text-foreground lg:max-w-none">
        {title}
      </h1>
      <div className="flex items-center justify-self-end">{right}</div>
    </div>
  );
}

/** Round grey button for the app bar (back, search, …). */
export function AppBarButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-foreground transition-transform active:scale-90',
        className,
      )}
      {...props}
    />
  );
}

/** Plain coloured text action for the app bar, like "Mark all as read". */
export function AppBarTextAction({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'px-1 py-2 text-[13px] font-medium text-brand-600 transition-opacity active:opacity-60 disabled:opacity-40 [.dark_&]:text-brand-300',
        className,
      )}
      {...props}
    />
  );
}

export type ChipItem<T extends string> = {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

/** Filled pill tabs that scroll sideways, edge to edge on phones. */
export function Chips<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: ChipItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('-mx-4 flex gap-2.5 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:px-0', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className={cn(
              'flex h-10 shrink-0 items-center gap-1.5 rounded-full px-5 text-[13px] font-medium transition-colors active:scale-[0.97]',
              active ? 'bg-brand-600 text-white [.dark_&]:bg-brand-500' : 'bg-surface-3 text-foreground-2',
            )}
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
