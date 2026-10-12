import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { SpeedWheel } from './workspace-loader';
import { cn } from '@/lib/utils';

export interface PopupMessageProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'loading';
  title: string;
  message?: string;
  onClose?: () => void;
}

export function PopupMessage({
  isOpen,
  type,
  title,
  message,
  onClose,
}: PopupMessageProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-edge bg-surface p-6 text-center shadow-2xl animate-scale-in">
        {onClose && type !== 'loading' && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-foreground-4 hover:bg-surface-3 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col items-center gap-4 pt-2">
          {type === 'success' && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>
          )}
          {type === 'error' && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner">
              <AlertTriangle className="h-9 w-9" />
            </div>
          )}
          {type === 'loading' && (
            <div className="flex flex-col items-center gap-2">
              <h3 className="text-sm font-medium text-foreground tracking-tight">{title}</h3>
              <SpeedWheel />
            </div>
          )}

          {type !== 'loading' && (
            <div className="space-y-1.5">
              <h3 className="text-base font-medium text-foreground tracking-tight">{title}</h3>
              {message && <p className="text-xs text-foreground-4 leading-relaxed">{message}</p>}
            </div>
          )}

          {type !== 'loading' && onClose && (
            <button
              onClick={onClose}
              className={cn(
                'mt-2 w-full rounded-full py-2.5 text-xs font-medium text-white shadow-md transition-all active:scale-95',
                type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700',
              )}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
