import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';

export function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { redirectTo?: string; subtitle?: string } | null;
  const redirectTo = state?.redirectTo || '/dashboard';
  const subtitle = state?.subtitle || 'Account Created';

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, redirectTo]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-50 px-4">
      <WaveBackground />

      <div className="flex flex-col items-center justify-center text-center space-y-6 animate-scale-in">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-600 shadow-xl">
          <Check className="h-16 w-16 text-white stroke-[3]" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-900">
            Success
          </h1>
          <p className="text-base text-ink-600 font-medium">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function WaveBackground() {
const OrangeGradientStart = '#087F5B';
const OrangeGradientEnd = '#0A6C4E';
const BlueGradientStart = '#1E926D';
const BlueGradientEnd = '#075B43';

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 opacity-15"
      aria-hidden
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 800"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="topWaveSuccess" x1="0%" y1="0%" x2="100%" y2="30%">
            <stop offset="0%" stopColor={OrangeGradientStart} />
            <stop offset="100%" stopColor={OrangeGradientEnd} />
          </linearGradient>
          <linearGradient id="bottomWaveSuccess" x1="0%" y1="70%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={BlueGradientStart} />
            <stop offset="100%" stopColor={BlueGradientEnd} />
          </linearGradient>
        </defs>
        <path
          fill="url(#topWaveSuccess)"
          d="M0,0 L1440,0 L1440,200 C1200,160 1000,120 800,180 C600,240 400,220 200,260 C0,280 0,240 0,200 Z"
        />
        <path
          fill="url(#bottomWaveSuccess)"
          d="M1440,800 L0,800 L0,620 C200,660 400,680 600,640 C800,600 1000,580 1200,560 C1400,540 1440,560 1440,600 Z"
        />
      </svg>
    </div>
  );
}
