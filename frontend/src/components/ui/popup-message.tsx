import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SpeedWheel } from './workspace-loader';
import { cn } from '@/lib/utils';

/* Colours taken from the Log Out confirmation: green #7CB82F for success, red for errors. */
const ICON_CLASS: Record<'success' | 'error', string> = {
  success: 'text-[#7CB82F]',
  error: 'text-[#DC2626]',
};

const BUTTON_CLASS: Record<'success' | 'error', string> = {
  success: 'bg-[#7CB82F]',
  error: 'bg-[#DC2626]',
};

export interface PopupMessageProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'loading';
  title: string;
  message?: string;
  onClose?: () => void;
}

/**
 * Modal message popup, built on the Log Out confirmation's design: dimmed backdrop,
 * white rounded card, big line icon, bold title, and a single full-width action button.
 */
export function PopupMessage({
  isOpen,
  type,
  title,
  message,
  onClose,
}: PopupMessageProps) {
  if (!isOpen) return null;

  const loading = type === 'loading';
  const Icon = type === 'error' ? AlertTriangle : CheckCircle2;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 px-5 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-[340px] rounded-2xl bg-white px-6 pb-6 pt-6 text-center text-slate-900 shadow-2xl animate-scale-in">
        <h2 className="text-lg font-semibold">{title}</h2>

        {loading ? (
          <div className="mt-4 flex justify-center">
            <SpeedWheel />
          </div>
        ) : (
          <>
            <Icon
              className={cn('mx-auto mt-6 h-20 w-20', ICON_CLASS[type])}
              strokeWidth={1.6}
              aria-hidden
            />
            {message && <p className="mt-6 text-[15px] leading-relaxed text-slate-700">{message}</p>}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'mt-6 h-12 w-full rounded-xl text-[15px] font-medium text-white transition-transform active:scale-[0.98]',
                  BUTTON_CLASS[type],
                )}
              >
                Continue
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}