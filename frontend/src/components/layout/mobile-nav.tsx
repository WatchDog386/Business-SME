import { NavLink } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Users,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function MobileNav() {
  return (
    <>
      {/* Bottom navigation */}
      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-full border border-white/10 bg-gradient-to-r from-[#0b1e3f] via-[#122b57] to-[#1a3a73] shadow-lg shadow-black/25 backdrop-blur-md">
        <div className="grid grid-cols-4 px-2 py-1.5">
          {tabs.map((tab, i) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/dashboard'}
              className="relative flex flex-col items-center justify-end gap-0.5 rounded-full pt-1 pb-1.5 text-[10px] font-medium transition-colors duration-300 hover:bg-white/10 animate-fade-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'relative flex h-9 w-14 items-center justify-center rounded-full transition-all duration-300 ease-out',
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
                        className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-white/80 animate-pulse"
                        aria-hidden
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      'leading-none transition-all duration-300 ease-out',
                      isActive
                        ? 'text-white -translate-y-0.5 scale-105'
                        : 'text-white/60 translate-y-0 scale-100',
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
