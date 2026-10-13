import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import {
  BarChart3,
  Download,
  Wallet,
  Package,
  PiggyBank,
  Scissors,
  UserCircle,
  Banknote,
  Settings,
  Sun,
  Moon,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useActiveBusiness } from '@/stores/business';
import { requestLogout } from './session-timeout';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/lib/theme';
import { TwoFactorSetting } from './two-factor-setting';

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
  { to: '/budgets', icon: PiggyBank, label: 'Budgets', description: 'Monthly limits & alerts', tint: 'cyan' },
];

const accountItems: Item[] = [
  { to: '/profile', icon: UserCircle, label: 'My Profile', description: 'Personal details & avatar', tint: 'info' },
  { to: '/account', icon: Banknote, label: 'My Account', description: 'Settings & preferences', tint: 'cyan' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 ml-1 text-[15px] font-medium tracking-tight text-foreground">
      {children}
    </p>
  );
}

/** Grid tile for the Business list: icon, label and description stacked. */
function BusinessTile({
  item,
  onClick,
}: {
  item: Item;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2.5 rounded-2xl bg-surface p-3.5 text-left shadow-sm transition-transform active:scale-[0.98]"
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          item.tint ? tints[item.tint] : 'bg-surface-2 text-foreground-2',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium leading-snug text-foreground">{item.label}</span>
        {item.description && <span className="mt-0.5 block text-[11.5px] leading-snug text-foreground-3">{item.description}</span>}
      </span>
    </button>
  );
}

interface SettingsPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPage({ open, onOpenChange }: SettingsPageProps) {
  const { canInstall, install } = useInstallPrompt();
  const active = useActiveBusiness();
  const user = useAuthStore((s) => s.user);
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

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-white scrollbar-none animate-fade-in [.dark_&]:bg-surface-2">
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

        {/* Identity — flat on background */}
        <button
          onClick={() => go('/profile')}
          className="mt-6 -mx-1 flex w-[calc(100%+0.5rem)] items-center gap-3.5 text-left rounded-xl px-1 py-2.5 transition-[transform,background-color] active:scale-[0.99] active:bg-surface-3"
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
        </button>

        {/* Business group — flat on background */}
        <section className="mt-6">
          <SectionLabel>Business</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {businessItems.map((item) => (
              <BusinessTile key={item.label} item={item} onClick={() => go(item.to)} />
            ))}
          </div>
        </section>

        {/* Account group — flat on background */}
        <section className="mt-6">
          <SectionLabel>Account</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {accountItems.map((item) => (
              <BusinessTile key={item.label} item={item} onClick={() => go(item.to)} />
            ))}
            <TwoFactorSetting tile />
          </div>
        </section>

        {canInstall && (
          <Button className="mt-6 w-full bg-[#549913] text-white hover:bg-[#467F10]" onClick={() => void install()}>
            <Download className="h-4 w-4" aria-hidden />
            Install Optimas app
          </Button>
        )}

        {/* Actions — part of the page */}
        <div className="grid grid-cols-2 gap-3 pt-6">
          <Button className="bg-black text-white hover:bg-zinc-800" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              requestLogout();
            }}
          >
            Log out
          </Button>
        </div>

        <p className="pt-5 text-center text-[11px] text-foreground-5">
          Optimas Technologies Ltd · Settings
        </p>
      </div>
    </div>,
    document.body,
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
