import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Users,
  BarChart3,
  Menu,
  Plus,
  Receipt,
  Wallet,
  UserPlus,
  Package,
  Scissors,
  Store,
  UserCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/ui/dialog';
import { useActiveBusiness } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: Home, tone: 'accent' },
  { to: '/sales', label: 'Sales', icon: ShoppingCart, tone: 'success' },
  { to: '/customers', label: 'Customers', icon: Users, tone: 'warning' },
  { to: '/reports', label: 'Reports', icon: BarChart3, tone: 'accent' },
] as const;

const tabToneClasses = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
} as const;

const quickActions = [
  { to: '/sales/new', label: 'Record Sale', icon: Receipt, tone: 'accent' },
  { to: '/expenses?new=1', label: 'Add Expense', icon: Wallet, tone: 'warning' },
  { to: '/customers?new=1', label: 'Add Customer', icon: UserPlus, tone: 'success' },
  { to: '/products?new=1', label: 'Add Product', icon: Package, tone: 'success' },
  { to: '/services?new=1', label: 'Add Service', icon: Scissors, tone: 'accent' },
];

const quickToneClasses = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
} as const;

const moreLinks = [
  { to: '/profile', label: 'My Profile', icon: UserCircle },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/services', label: 'Services', icon: Scissors },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const active = useActiveBusiness();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setActionsOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 transition-transform active:scale-95"
        aria-label="Quick actions"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-edge bg-surface">
        <div className="grid grid-cols-5">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/dashboard'}
              className="relative flex flex-col items-center justify-end gap-0.5 pt-1.5 pb-2 text-[10px] font-semibold"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'relative flex h-9 w-14 items-center justify-center rounded-2xl transition-all duration-300 ease-out',
                      isActive ? '-translate-y-0.5' : 'translate-y-0',
                    )}
                    aria-hidden
                  >
                    <tab.icon
                      className={cn(
                        'h-[22px] w-[22px] transition-all duration-300 ease-out',
                        isActive ? cn('scale-110', tabToneClasses[tab.tone]) : tabToneClasses[tab.tone],
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {isActive && (
                      <span
                        className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-foreground-4 animate-pulse"
                        aria-hidden
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      'leading-none transition-all duration-300 ease-out',
                      isActive
                        ? 'text-foreground -translate-y-0.5 scale-105'
                        : 'text-foreground-5 translate-y-0 scale-100',
                    )}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setMenuOpen(true)}
            className="relative flex flex-col items-center justify-end gap-0.5 pt-1.5 pb-2 text-[10px] font-semibold"
            aria-label="More options"
          >
            <span
              className={cn(
                'relative flex h-9 w-14 items-center justify-center rounded-2xl transition-all duration-300 ease-out',
                menuOpen ? '-translate-y-0.5' : 'translate-y-0',
              )}
            >
              <Menu
                className={cn(
                  'h-[22px] w-[22px] transition-all duration-300 ease-out',
                  menuOpen ? 'scale-110 text-foreground' : 'scale-100 text-foreground-5',
                )}
                strokeWidth={menuOpen ? 2.5 : 2}
              />
            </span>
            <span
              className={cn(
                'leading-none transition-all duration-300 ease-out',
                menuOpen
                  ? 'text-foreground -translate-y-0.5 scale-105'
                  : 'text-foreground-5 translate-y-0 scale-100',
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More menu */}
      <Dialog
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={active?.name ?? 'Menu'}
        description={active ? `Manage ${active.name}` : undefined}
      >
        <div className="space-y-1">
          <div
            onClick={() => {
              setMenuOpen(false);
              navigate('/profile');
            }}
            className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3 cursor-pointer transition-colors hover:bg-surface-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-sm font-bold text-accent">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.fullName?.charAt(0).toUpperCase() ?? '?'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {user?.fullName ?? ''}
              </p>
              <p className="truncate text-xs text-foreground-5">{user?.email ?? ''}</p>
            </div>
          </div>
          {moreLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => {
                setMenuOpen(false);
                navigate(link.to);
              }}
              className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-foreground-3 transition-colors hover:bg-surface-2"
            >
              <link.icon className="h-5 w-5 text-foreground-5" aria-hidden />
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate('/onboarding');
            }}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-foreground-3 transition-colors hover:bg-surface-2"
          >
            <Store className="h-5 w-5 text-foreground-5" aria-hidden />
            Add another business
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
          >
            <X className="h-5 w-5" aria-hidden />
            Log out
          </button>
        </div>
      </Dialog>

      {/* Quick actions */}
      <Dialog
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        title="Quick actions"
      >
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => {
                setActionsOpen(false);
                navigate(action.to);
              }}
              className="flex flex-col items-start gap-2 rounded-2xl border border-edge p-4 text-left transition-colors hover:border-accent-border hover:bg-accent-soft"
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  quickToneClasses[action.tone as keyof typeof quickToneClasses],
                )}
              >
                <action.icon className="h-5 w-5" aria-hidden />
              </div>
              <span className="text-sm font-bold text-foreground">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </Dialog>
    </>
  );
}