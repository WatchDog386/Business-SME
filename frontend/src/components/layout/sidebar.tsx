import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Scissors,
  Wallet,
  PiggyBank,
  Banknote,
  BarChart3,
  UserPlus,
  Download,
  Settings,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardApi } from '@/api/endpoints';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { useRole } from '@/hooks/use-role';
import logoMark from '@/assets/optimas-logo.svg';

/**
 * Desktop navigation: a dark icon rail beside a lighter label column, with the
 * active item drawn as a white pill across both.
 */
export function Sidebar() {
  const { canInstall, install } = useInstallPrompt();
  const { canApprove } = useRole();
  const navigate = useNavigate();
  // Shares the dashboard query cache, so this adds no extra request.
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  const pending = canApprove ? data?.pendingApprovals ?? 0 : 0;

  const navItems: Array<{ to: string; label: string; icon: LucideIcon; badge?: number }> = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/sales', label: 'Sales', icon: ShoppingCart },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/services', label: 'Services', icon: Scissors },
    { to: '/expenses', label: 'Expenses', icon: Wallet, badge: pending },
    { to: '/budgets', label: 'Budgets', icon: PiggyBank },
    { to: '/account', label: 'Account', icon: Banknote },
    { to: '/staff', label: 'Staff', icon: UserPlus },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:flex">
      {/* Two-tone background: icon rail + label column */}
      <div className="absolute inset-y-0 left-0 w-16 bg-brand-800" aria-hidden />
      <div className="absolute inset-y-0 left-16 right-0 bg-brand-600" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-20"
        style={{
          background:
            'radial-gradient(120% 80% at 0% 100%, rgba(255,255,255,0.35), transparent 60%)',
        }}
        aria-hidden
      />

      <div className="relative flex w-full flex-col">
        <div className="flex h-16 items-center">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex w-16 justify-center"
            aria-label="Optimas dashboard"
          >
            <img src={logoMark} alt="" className="h-9 w-9 rounded-xl shadow-sm ring-2 ring-white/90" />
          </button>
          <p className="flex items-center gap-1 pl-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
            Navigation
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto py-3 pr-3" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-11 items-center rounded-r-full text-[12px] font-medium uppercase tracking-wide transition-colors',
                  isActive
                    ? 'ml-2 rounded-l-full bg-white text-brand-700 shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('flex shrink-0 justify-center', isActive ? 'w-14' : 'w-16')}>
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="truncate pl-4">{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto mr-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 pb-4 pr-3">
          {canInstall && (
            <button
              type="button"
              onClick={() => void install()}
              className="flex h-11 w-full items-center rounded-r-full text-[12px] font-medium uppercase tracking-wide text-white/85 hover:bg-white/10"
            >
              <span className="flex w-16 justify-center">
                <Download className="h-5 w-5" aria-hidden />
              </span>
              <span className="pl-4">Install app</span>
            </button>
          )}
          <NavLink
            to="/account"
            className="flex h-11 w-full items-center rounded-r-full text-[12px] font-medium uppercase tracking-wide text-white/85 hover:bg-white/10"
          >
            <span className="flex w-16 justify-center">
              <Settings className="h-5 w-5" aria-hidden />
            </span>
            <span className="pl-4">Settings</span>
          </NavLink>
          <p className="pl-20 text-[10px] text-white/50">
            © {new Date().getFullYear()} Optimas Technologies
          </p>
        </div>
      </div>
    </aside>
  );
}
