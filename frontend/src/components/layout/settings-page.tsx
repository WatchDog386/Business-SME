import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Wallet,
  Package,
  Scissors,
  Store,
  UserCircle,
  Banknote,
  ChevronRight,
  Settings,
  Moon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useActiveBusiness } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/lib/theme';
import { ThemeToggle } from '@/components/layout/theme-toggle';

type Tint = keyof typeof tints;

const tints = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
};

interface Item {
  to: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  tint?: Tint;
}

const businessItems: Item[] = [
  { to: '/reports', icon: BarChart3, label: 'Reports', description: 'Sales insights & analytics', tint: 'accent' },
  { to: '/products', icon: Package, label: 'Products', description: 'Inventory & stock levels', tint: 'warning' },
  { to: '/services', icon: Scissors, label: 'Services', description: 'Your service catalog', tint: 'info' },
  { to: '/expenses', icon: Wallet, label: 'Expenses', description: 'Track your spending', tint: 'success' },
];

const accountItems: Item[] = [
  { to: '/profile', icon: UserCircle, label: 'My Profile', description: 'Personal details & avatar', tint: 'accent' },
  { to: '/account', icon: Banknote, label: 'My Account', description: 'Settings & preferences', tint: 'info' },
  { to: '/onboarding', icon: Store, label: 'Add another business', description: 'Set up and switch stores', tint: 'success' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 ml-1 text-xs font-medium uppercase tracking-wide text-foreground-4">
      {children}
    </p>
  );
}

function Row({
  item,
  onClick,
  last = false,
}: {
  item: Item;
  onClick: () => void;
  last?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="relative flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3"
    >
      {!last && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[58px] right-0 h-px bg-edge/60"
        />
      )}
      <span
        className={cn(
          'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]',
          item.tint ? tints[item.tint] : 'bg-surface-3 text-foreground-2',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug text-foreground">{item.label}</span>
        {item.description && (
          <span className="block truncate text-xs leading-snug text-foreground-3">
            {item.description}
          </span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-foreground-5" aria-hidden />
    </button>
  );
}

interface SettingsPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPage({ open, onOpenChange }: SettingsPageProps) {
  const active = useActiveBusiness();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-surface-2 scrollbar-none animate-fade-in">
      <div className="mx-auto max-w-md px-4 pb-10 pt-7">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-foreground-3">Your workspace</p>
            <h1 className="flex items-center gap-2 text-lg font-medium tracking-tight text-foreground sm:text-xl">
              <Settings className="h-5 w-5 text-accent" aria-hidden />
              Settings
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Identity card */}
        <button
          onClick={() => go('/profile')}
          className="mt-6 flex w-full items-center gap-3.5 rounded-xl bg-surface p-4 text-left shadow-soft transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3"
        >
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-lg font-semibold text-accent">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              user?.fullName?.charAt(0).toUpperCase() ?? '?'
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold text-foreground">
              {user?.fullName ?? ''}
            </span>
            <span className="block truncate text-[13px] text-foreground-3">
              {user?.email ?? ''}
            </span>
            {active?.subscription_plan && (
              <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {active.subscription_plan}
              </span>
            )}
          </span>
          <ChevronRight className="h-4.5 w-4.5 shrink-0 text-foreground-5" aria-hidden />
        </button>

        {/* Business group */}
        <section className="mt-6">
          <SectionLabel>Business</SectionLabel>
          <div className="overflow-hidden rounded-xl bg-surface shadow-soft">
            {businessItems.map((item, i) => (
              <Row key={item.label} item={item} onClick={() => go(item.to)} last={i === businessItems.length - 1} />
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section className="mt-6">
          <SectionLabel>Appearance</SectionLabel>
          <div className="overflow-hidden rounded-xl bg-surface shadow-soft">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle dark mode"
            >
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-info-soft text-info">
                <Moon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-snug text-foreground">Dark mode</span>
                <span className="block truncate text-xs leading-snug text-foreground-3">
                  {theme === 'dark' ? 'Dark theme is on' : 'Light theme is on'}
                </span>
              </span>
              <span
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                  theme === 'dark' ? 'bg-accent' : 'bg-edge-2',
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
                    theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-0.5',
                  )}
                />
              </span>
            </button>
          </div>
        </section>

        {/* Account group */}
        <section className="mt-6">
          <SectionLabel>Account</SectionLabel>
          <div className="overflow-hidden rounded-xl bg-surface shadow-soft">
            {accountItems.map((item, i) => (
              <Row
                key={item.label}
                item={item}
                onClick={() => go(item.to)}
                last={i === accountItems.length - 1}
              />
            ))}
          </div>
        </section>

        {/* Actions — part of the page */}
        <div className="grid grid-cols-2 gap-3 pt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              logout();
              navigate('/login');
            }}
          >
            Log out
          </Button>
        </div>

        <p className="pt-5 text-center text-[11px] text-foreground-5">
          Biashara · Settings
        </p>
      </div>
    </div>
  );
}
