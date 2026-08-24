import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { WaveBackground } from '@/components/layout/wave-background';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-2 px-4">
      <WaveBackground />

      <div className="flex flex-col items-center justify-center text-center space-y-6 animate-scale-in">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-600 shadow-xl">
          <Check className="h-16 w-16 text-white stroke-[3]" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-medium tracking-tight text-foreground">
            Success
          </h1>
          <p className="text-sm text-foreground-3 font-medium">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
