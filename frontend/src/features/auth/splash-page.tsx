import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

export function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4">
      <div className="relative mb-6 flex flex-col items-center">
        <img
          src={logo}
          alt="Biashara logo"
          className="relative h-44 w-44 object-contain"
        />
      </div>

      <div className="space-y-3 flex flex-col items-center">
        <p className="text-sm font-bold tracking-wide text-gray-800 font-sans">
          Professional Business Manager
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 font-sans">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Loading your experience...</span>
        </div>
      </div>
    </div>
  );
}
