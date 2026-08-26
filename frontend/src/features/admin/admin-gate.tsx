import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/auth';
import { PageLoader } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, iconColor: 'text-blue-600', end: true },
  { to: '/admin/businesses', label: 'Businesses', icon: Building2, iconColor: 'text-blue-900' },
  { to: '/admin/payments', label: 'Payments', icon: Wallet, iconColor: 'text-emerald-600' },
  { to: '/admin/users', label: 'Users', icon: Users, iconColor: 'text-amber-600' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, iconColor: 'text-zinc-600' },
];

/**
 * Standalone console for the app owner — separate from the business app
 * shell so admins land here instead of a business dashboard.
 */
export function AdminGate() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  if (!token) return <Navigate to="/login" replace />;
  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader />
      </div>
    );
  }
  if (meQuery.error || !meQuery.data?.isAdmin) {
    return <Navigate to={user ? '/dashboard' : '/login'} replace />;
  }

  return (
    <div className="min-h-screen bg-surface-2">
      <header className="sticky top-0 z-20 bg-surface-2">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          {/* Logo only — enlarged, no wordmark */}
          <NavLink to="/admin" className="shrink-0" aria-label="Admin home">
            <img
              src={logo}
              alt="OmniTrack"
              className="h-14 w-14 rounded-2xl object-contain"
            />
          </NavLink>

          {/* Centre title */}
          <h1 className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-base font-medium tracking-tight text-foreground">
            Platform Admin
          </h1>

          {/* Dropdown account menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border border-edge transition-colors hover:bg-surface-2 active:bg-surface-3',
                menuOpen ? 'border-edge-2 text-blue-900' : 'text-blue-900',
              )}
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-edge bg-surface shadow-lift animate-scale-in">
                <div className="border-b border-edge px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Platform Admin
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {meQuery.data.fullName}
                  </p>
                  <p className="truncate text-xs text-foreground-4">
                    {meQuery.data.email}
                  </p>
                </div>

                {/* Section links */}
                <div className="space-y-0.5 p-1.5">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.to}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate(item.to);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-foreground-2 transition-colors hover:bg-surface-2"
                    >
                      <item.icon className={cn('h-4 w-4', (item as any).iconColor)} aria-hidden />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="p-1.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav tabs */}
        <nav className="flex gap-1 overflow-x-auto bg-surface-2 px-3 pb-2 lg:hidden scrollbar-none">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'bg-transparent text-foreground-3 hover:bg-surface-2',
                )
              }
            >
              <item.icon className={cn('h-3.5 w-3.5', (item as any).iconColor)} aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
