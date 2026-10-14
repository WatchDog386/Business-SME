import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { SpeedWheel } from './workspace-loader';
import { cn } from '@/lib/utils';

export type PopupKind = 'success' | 'error' | 'info' | 'warning' | 'loading';

/* Colours taken from the Log Out confirmation: green #7CB82F for success, red for errors. */
const ICON_CLASS: Record<Exclude<PopupKind, 'loading'>, string> = {
  success: 'text-[#7CB82F]',
  error: 'text-[#DC2626]',
  info: 'text-[#2F6FB5]',
  warning: 'text-[#D97706]',
};

const BUTTON_CLASS: Record<Exclude<PopupKind, 'loading'>, string> = {
  success: 'bg-[#7CB82F]',
  error: 'bg-[#DC2626]',
  info: 'bg-[#2F6FB5]',
  warning: 'bg-[#D97706]',
};

const ICON: Record<Exclude<PopupKind, 'loading'>, typeof Info> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
};

export interface PopupMessageProps {
  isOpen: boolean;
  type: PopupKind;
  title: string;
  message?: string;
  onClose?: () => void;
}

/**
 * The message card itself, built on the Log Out confirmation's design: a white
 * rounded card, big line icon, bold title, and a single full-width action
 * button. The backdrop and the stacking belong to PopupHost.
 */
export function PopupMessage({ isOpen, type, title, message, onClose }: PopupMessageProps) {
  if (!isOpen) return null;

  if (type === 'loading') {
    return (
      <div className="w-full max-w-[340px] rounded-2xl bg-white px-6 py-7 text-center text-slate-900 shadow-2xl animate-scale-in">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4 flex justify-center">
          <SpeedWheel />
        </div>
      </div>
    );
  }

  const Icon = ICON[type];

  return (
    <div className="w-full max-w-[340px] rounded-2xl bg-white px-6 pb-6 pt-6 text-center text-slate-900 shadow-2xl animate-scale-in">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Icon className={cn('mx-auto mt-6 h-20 w-20', ICON_CLASS[type])} strokeWidth={1.6} aria-hidden />
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
    </div>
  );
}
