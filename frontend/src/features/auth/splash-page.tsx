import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';

export function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-surface px-6 py-12">
      {/* Background image — clear, no overshadow */}
      <img
        src="https://i.pinimg.com/1200x/ba/bf/04/babf04937867a59226178486b7d30220.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex-1" />

      <div className="relative z-10 mb-6 flex flex-col items-center">
        <img
          src={logo}
          alt="Biashara logo"
          className="relative h-44 w-44 object-contain drop-shadow-sm"
        />
        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground font-quicksand text-center drop-shadow-sm">
          Professional Business Manager
        </h1>
        <p className="mt-1 text-sm text-foreground-3 font-quicksand text-center max-w-xs">
          Manage sales, inventory, customers, and reports effortlessly.
        </p>
      </div>

      <div className="relative z-10 flex-1" />

      <div className="relative z-10 w-full max-w-sm space-y-3 pb-6">
        <Button
          onClick={() => navigate('/register')}
          className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-bold shadow-md"
        >
          Get Started
        </Button>
        <button
          onClick={() => navigate('/login')}
          className="w-full text-center text-sm font-semibold text-foreground-3 hover:text-foreground py-2"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}
