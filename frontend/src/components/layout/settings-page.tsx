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
  Sun,
  Moon,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useActiveBusiness } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/lib/theme';

type Tint = keyof typeof tints;

const tints = {
  accent: 'bg-accent text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-brand-600 text-white',
  purple: 'bg-purple-600 text-white',
  rose: 'bg-rose-500 text-white',
  cyan: 'bg-cyan-600 text-white',
};

interface Item {
  to: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  tint?: Tint;
}

const businessItems: Item[] = [
  { to: '/reports', icon: BarChart3, label: 'Reports', description: 'Sales insights & analytics', tint: 'purple' },
  { to: '/staff', icon: Users, label: 'Team Members', description: 'Invite & manage staff', tint: 'info' },
  { to: '/products', icon: Package, label: 'Products', description: 'Inventory & stock levels', tint: 'warning' },
  { to: '/services', icon: Scissors, label: 'Services', description: 'Your service catalog', tint: 'rose' },
  { to: '/expenses', icon: Wallet, label: 'Expenses', description: 'Track your spending', tint: 'success' },
];

const accountItems: Item[] = [
  { to: '/profile', icon: UserCircle, label: 'My Profile', description: 'Personal details & avatar', tint: 'info' },
  { to: '/account', icon: Banknote, label: 'My Account', description: 'Settings & preferences', tint: 'cyan' },
  { to: '/onboarding', icon: Store, label: 'Add another business', description: 'Set up and switch stores', tint: 'accent' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 ml-1 text-[15px] font-medium tracking-tight text-foreground">
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
      className="relative flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3"
    >
      {!last && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[46px] right-0 h-px bg-edge/60"
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
        <header className="flex items-start justify-between gap-3 leading-tight">
          <div>
            <p className="text-[13px] font-medium text-foreground-3">Your workspace</p>
            <h1 className="flex items-center gap-2 text-lg font-medium tracking-tight text-foreground sm:text-xl">
              <Settings className="h-5 w-5 text-accent" aria-hidden />
              Settings
            </h1>
          </div>
          <ThemeSwitch />
        </header>

        {/* Identity — dull tile like admin dashboard */}
        <button
          onClick={() => go('/profile')}
          className="mt-6 flex w-full items-center gap-3.5 rounded-xl bg-surface-3 p-4 text-left transition-colors duration-150 hover:bg-surface-2 active:bg-surface-3"
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

        {/* Business group — flat on background */}
        <section className="mt-6">
          <SectionLabel>Business</SectionLabel>
          {businessItems.map((item, i) => (
            <Row key={item.label} item={item} onClick={() => go(item.to)} last={i === businessItems.length - 1} />
          ))}
        </section>

        {/* Account group — flat on background */}
        <section className="mt-6">
          <SectionLabel>Account</SectionLabel>
          {accountItems.map((item, i) => (
            <Row
              key={item.label}
              item={item}
              onClick={() => go(item.to)}
              last={i === accountItems.length - 1}
            />
          ))}
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
          OmniTrack · Settings
        </p>
      </div>
    </div>
  );
}

function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative mt-1 h-7 w-[52px] shrink-0 rounded-full transition-colors duration-200',
        isDark ? 'bg-accent' : 'bg-edge-2',
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200',
          isDark ? 'translate-x-6' : 'translate-x-0',
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-accent" aria-hidden />
        ) : (
          <Sun className="h-3.5 w-3.5 text-warning" aria-hidden />
        )}
      </span>
    </button>
  );
}
