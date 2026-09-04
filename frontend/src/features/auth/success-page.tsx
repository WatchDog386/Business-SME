import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { WaveBackground } from '@/components/layout/wave-background';

const LOADING_MESSAGES = [
  'Verifying your account details...',
  'Preparing your dashboard...',
];

export function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { redirectTo?: string; subtitle?: string } | null;
  const redirectTo = state?.redirectTo || '/dashboard';
  const subtitle = state?.subtitle || 'Account Created';
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, 3200);
    return () => clearTimeout(timer);
  }, [navigate, redirectTo]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-2 px-4">
      <WaveBackground />

      <div className="flex flex-col items-center justify-center text-center space-y-7 animate-scale-in max-w-sm w-full">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 shadow-xl">
          <Check className="h-12 w-12 text-white" strokeWidth={1.75} />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {subtitle}
          </h1>
          <p className="text-sm font-medium text-foreground-3 min-h-[20px] transition-all duration-300">
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Loading animation — orange / red / green */}
        <div className="flex flex-col items-center w-full pt-2">
          <style>{`@keyframes dotScale { 0%, 80%, 100% { transform: scale(0.75); opacity: 0.45; } 40% { transform: scale(1); opacity: 1; } }`}</style>
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" style={{ animation: 'dotScale 1s 0s infinite' }} />
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ animation: 'dotScale 1s 0.2s infinite' }} />
            <span className="h-2.5 w-2.5 rounded-full bg-[#39B54A] shadow-[0_0_8px_rgba(57,181,74,0.6)]" style={{ animation: 'dotScale 1s 0.4s infinite' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
