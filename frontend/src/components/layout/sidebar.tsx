import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Scissors,
  Wallet,
  Banknote,
  BarChart3,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_EMAILS } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth';
import { Brand } from './brand';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = Boolean(
    user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase() as never),
  );
  const navItems: Array<{ to: string; label: string; icon: LucideIcon }> = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/sales', label: 'Sales', icon: ShoppingCart },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/services', label: 'Services', icon: Scissors },
    { to: '/expenses', label: 'Expenses', icon: Wallet },
    { to: '/account', label: 'Account', icon: Banknote },
    { to: '/staff', label: 'Staff', icon: UserPlus },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-edge bg-surface-2 lg:flex">
      <div className="border-b border-edge px-5 py-4">
        <Brand onDark />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-foreground-4 hover:bg-surface-3 hover:text-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-edge p-4">
        <p className="text-xs text-foreground-5">
          Built for Kenyan businesses.
        </p>
      </div>
    </aside>
  );
}