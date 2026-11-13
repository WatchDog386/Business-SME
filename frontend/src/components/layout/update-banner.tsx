import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAppUpdate } from '@/hooks/use-app-update';

/** "New version ready" pill that drops in from the top once a release is deployed. */
export function UpdateBanner() {
  const { available, apply } = useAppUpdate();
  const [busy, setBusy] = useState(false);

  return (
    <AnimatePresence>
      {available && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="pointer-events-none fixed inset-x-0 z-[90] flex justify-center px-3.5"
          style={{ top: 'calc(var(--sat, 0px) + 10px)' }}
        >
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void apply();
            }}
            aria-label="Update to the new version"
            className="pointer-events-auto flex w-full max-w-[460px] items-center gap-3 rounded-[22px] bg-[#111827] py-2.5 pl-3 pr-2.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-transform active:scale-[0.98] disabled:opacity-80"
          >
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#FFD400] text-[#111827]">
              <Sparkles size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold leading-tight text-white">New version ready</span>
              <span className="block text-[12px] leading-tight text-white/65">Tap to update. It takes a second.</span>
            </span>
            <span className="flex h-[34px] shrink-0 items-center rounded-full bg-[#FFD400] px-3.5 text-[12px] font-bold text-[#111827]">
              {busy ? 'Updating…' : 'Update'}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
