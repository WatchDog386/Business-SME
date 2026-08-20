import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/profile')}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-base font-bold text-white transition-transform active:scale-95 shadow-sm"
          aria-label="My Profile"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            user?.fullName?.charAt(0).toUpperCase() ?? '?'
          )}
        </button>
        <div className="leading-tight">
          <p className="text-base font-bold text-foreground">
            {greeting()},
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            {user?.fullName ? user.fullName.split(' ')[0] : 'User'} <span className="inline-block">👋</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-10 w-10 items-center justify-center text-foreground-3 transition-colors hover:text-accent"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center text-foreground-3 transition-colors hover:text-accent"
          aria-label="Search"
        >
          <Search className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </header>
  );
}