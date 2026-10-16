import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { overrideStatusBarColor } from '@/lib/theme';
import { Brand } from '@/components/layout/brand';

/** Status lines shown in turn while signing in and loading the dashboard. */
const STEPS = [
  'Please wait…',
  'Verifying…',
  'Signing you in…',
  'Preparing your workspace…',
  'Loading your dashboard…',
  'Almost there…',
];
const STEP_MS = 1300;

/*
 * Signing in passes through several screens that each show this loader
 * (verify, sign-in success, workspace, dashboard data). Remember when it
 * started so each new mount carries on from the same status line: on screen
 * it is one continuous loader.
 */
let startedAt = 0;
let hiddenAt = 0;

/** How long the sign-in loader has been on screen, in milliseconds. */
export function loaderElapsed(): number {
  return startedAt ? Date.now() - startedAt : 0;
}

/**
 * Advanced version of the KUCCPS speeding wheel: the original ring (top and
 * bottom arcs in Optimas blue, sides clear, spinning fast) with a green outer
 * ring turning the other way and a pulsing centre.
 */
/** `light` keeps the light-mode colours even in dark mode (the full-screen loader). */
export function SpeedWheel({ light = false }: { light?: boolean }) {
  const dk = (cls: string) => (light ? '' : ' ' + cls);
  return (
    <span className="relative flex h-[58px] w-[58px] items-center justify-center" aria-hidden>
      <style>{`
        @keyframes optimas-wheel { to { transform: rotate(360deg); } }
        @keyframes optimas-wheel-back { to { transform: rotate(-360deg); } }
        @keyframes optimas-core { 0%, 100% { transform: scale(0.7); opacity: 0.55; } 50% { transform: scale(1); opacity: 1; } }
      `}</style>
      {/* Faint track */}
      <span className={'absolute inset-0 rounded-full border-2 border-[#0033A1]/[0.07]' + dk('[.dark_&]:border-white/[0.08]')} />
      {/* Outer ring: green left and right arcs, turning the other way */}
      <span
        className="absolute inset-0 rounded-full border-2 border-[#56A01B] border-y-transparent"
        style={{ animation: 'optimas-wheel-back 900ms linear infinite' }}
      />
      {/* The original speeding wheel */}
      <span
        className={'absolute inset-[9px] rounded-full border-[2.5px] border-[#0033A1] border-x-transparent' + dk('[.dark_&]:border-[#5B8CFF] [.dark_&]:border-x-transparent')}
        style={{ animation: 'optimas-wheel 425ms linear infinite' }}
      />
      {/* Pulsing centre */}
      <span
        className={'h-2 w-2 rounded-full bg-[#0033A1]' + dk('[.dark_&]:bg-[#5B8CFF]')}
        style={{ animation: 'optimas-core 1.1s ease-in-out infinite' }}
      />
    </span>
  );
}

/**
 * Full-screen loader from "Verify and continue" until the dashboard is ready.
 * Dark dashboard surface with the Optimas mark while workspace data loads.
 */
export function WorkspaceLoader() {
  const [now, setNow] = useState(() => {
    // Once per mount: a fresh start unless the previous loader just closed
    if (startedAt === 0 || Date.now() - hiddenAt > 600) startedAt = Date.now();
    return Date.now() - startedAt;
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now() - startedAt), 150);
    return () => {
      window.clearInterval(timer);
      hiddenAt = Date.now();
    };
  }, []);

  // A white screen while signing in, with the status bar to match
  useEffect(() => overrideStatusBarColor('#FFFFFF'), []);

  const step = Math.min(STEPS.length - 1, Math.floor(now / STEP_MS));

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[99] flex flex-col items-center justify-center bg-white text-slate-900"
    >
      <Brand size="md" compact />
      <div className="mt-6 flex h-7 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={step}
            className="text-[17px] font-medium text-slate-700"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}
