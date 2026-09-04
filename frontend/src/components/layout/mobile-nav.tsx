import { NavLink } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Users,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/dashboard', label: 'Home', icon: Home, tone: 'accent' },
  { to: '/sales', label: 'Sales', icon: ShoppingCart, tone: 'success' },
  { to: '/staff', label: 'Staff', icon: UserPlus, tone: 'info' },
  { to: '/customers', label: 'Customers', icon: Users, tone: 'warning' },
  { to: '/reports', label: 'Reports', icon: BarChart3, tone: 'accent' },
] as const;

const tabToneClasses = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
} as const;

export function MobileNav() {
  return (
    <>
      {/* Bottom navigation — seamless with dashboard, no line */}
      <nav className="fixed inset-x-0 bottom-0 z-30 bg-surface-2">
        <div className="grid grid-cols-5 px-2 py-1.5">
          {tabs.map((tab, i) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/dashboard'}
              className="relative flex flex-col items-center justify-end gap-0.5 pt-1.5 pb-2 text-[10px] font-semibold transition-colors duration-300 hover:bg-surface-2 animate-fade-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'relative flex h-9 w-14 items-center justify-center rounded-2xl transition-all duration-300 ease-out',
                      isActive
                        ? 'bg-accent-soft shadow-sm -translate-y-0.5 animate-scale-in'
                        : 'bg-transparent translate-y-0',
                    )}
                    aria-hidden
                  >
                    <tab.icon
                      className={cn(
                        'h-[22px] w-[22px] transition-all duration-300 ease-out',
                        isActive
                          ? cn('scale-110', tabToneClasses[tab.tone], 'animate-scale-in')
                          : cn('scale-100', tabToneClasses[tab.tone], 'opacity-90'),
                      )}
                      strokeWidth={isActive ? 2.6 : 2}
                    />
                    {isActive && (
                      <span
                        className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent animate-pulse"
                        aria-hidden
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      'leading-none transition-all duration-300 ease-out',
                      isActive
                        ? 'text-accent -translate-y-0.5 scale-105 font-bold'
                        : 'text-foreground-3 translate-y-0 scale-100',
                    )}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
