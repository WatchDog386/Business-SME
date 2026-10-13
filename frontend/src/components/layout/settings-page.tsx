import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import {
  ArrowLeft,
  BarChart3,
  Download,
  Wallet,
  Package,
  PiggyBank,
  Scissors,
  UserRound,
  Banknote,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveBusiness } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { TwoFactorSetting } from './two-factor-setting';
import { BubbleTile, ProfileRing, profileCompletion } from './profile-visuals';

interface Item {
  to: string;
  icon: LucideIcon;
  label: string;
  description?: string;
}

const businessItems: Item[] = [
  { to: '/reports', icon: BarChart3, label: 'Reports', description: 'Sales insights & analytics' },
  { to: '/staff', icon: Users, label: 'Team Members', description: 'Invite & manage staff' },
  { to: '/products', icon: Package, label: 'Products', description: 'Inventory & stock levels' },
  { to: '/services', icon: Scissors, label: 'Services', description: 'Your service catalog' },
  { to: '/expenses', icon: Wallet, label: 'Expenses', description: 'Track your spending' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets', description: 'Monthly limits & alerts' },
];

const accountItems: Item[] = [
  { to: '/profile', icon: UserRound, label: 'My Profile', description: 'Details, theme & log out' },
  { to: '/account', icon: Banknote, label: 'My Account', description: 'Settings & preferences' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 ml-1 text-[15px] font-medium tracking-tight text-foreground">
      {children}
    </p>
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
  const completion = profileCompletion(user);

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

  const close = () => onOpenChange(false);

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-white scrollbar-none animate-fade-in [.dark_&]:bg-black">
      {/* Header: back on the left, title centred, close on the right (where the theme switch used to be) */}
      <header className="sticky top-0 z-10 border-b border-edge bg-white pt-[env(safe-area-inset-top)] [.dark_&]:border-white/10 [.dark_&]:bg-black">
        <div className="mx-auto flex h-14 max-w-md items-center px-2">
          <button
            type="button"
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-foreground transition-transform active:scale-90"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" aria-hidden />
          </button>
          <h1 className="flex-1 text-center text-[17px] font-semibold tracking-tight text-foreground">Settings</h1>
          <button
            type="button"
            onClick={close}
            className="flex h-11 w-11 items-center justify-center text-foreground transition-transform active:scale-90"
            aria-label="Close"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pb-10 pt-8">
        {/* Identity, centred: ring avatar with profile completion */}
        <section className="flex flex-col items-center text-center">
          <ProfileRing
            percent={completion}
            label={`${completion}%`}
            avatarUrl={user?.avatarUrl}
            initial={user?.fullName?.charAt(0).toUpperCase()}
            onEdit={() => go('/profile')}
          />
          <p className="mt-6 text-base font-semibold text-foreground">{user?.fullName ?? ''}</p>
          <p className="text-[13px] text-foreground-3">{user?.email ?? ''}</p>
          {active?.subscription_plan && (
            <span className="mt-1.5 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              {active.subscription_plan}
            </span>
          )}
        </section>

        <p className="mt-6 border-b border-edge pb-3 text-[15px] text-foreground [.dark_&]:border-white/25">
          Manage your business and account
        </p>

        {/* Business group */}
        <section className="mt-6">
          <SectionLabel>Business</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {businessItems.map((item) => (
              <BubbleTile key={item.label} icon={item.icon} title={item.label} description={item.description} onClick={() => go(item.to)} />
            ))}
          </div>
        </section>

        {/* Account group */}
        <section className="mt-6">
          <SectionLabel>Account</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            {accountItems.map((item) => (
              <BubbleTile key={item.label} icon={item.icon} title={item.label} description={item.description} onClick={() => go(item.to)} />
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

        <p className="pt-6 text-center text-[11px] text-foreground-5">
          Theme and Log out are in My Profile · Optimas Technologies Ltd
        </p>
      </div>
    </div>,
    document.body,
  );
}
