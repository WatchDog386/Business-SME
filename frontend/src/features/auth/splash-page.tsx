import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';

export function SplashPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-white px-6 py-12">
      <div className="flex-1" />

      <div className="relative mb-6 flex flex-col items-center">
        <img
          src={logo}
          alt="Biashara logo"
          className="relative h-44 w-44 object-contain"
        />
        <h1 className="mt-4 text-xl font-bold tracking-tight text-gray-900 font-poppins text-center">
          Professional Business Manager
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-poppins text-center max-w-xs">
          Manage sales, inventory, customers, and reports effortlessly.
        </p>
      </div>

      <div className="flex-1" />

      <div className="w-full max-w-sm space-y-3 pb-6">
        <Button
          onClick={() => navigate('/register')}
          className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-bold shadow-md"
        >
          Get Started
        </Button>
        <button
          onClick={() => navigate('/login')}
          className="w-full text-center text-sm font-semibold text-gray-600 hover:text-gray-900 py-2"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}
