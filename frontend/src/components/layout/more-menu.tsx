import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Moon,
  Package,
  Scissors,
  ShieldCheck,
  Store,
  Sun,
  UserCircle,
  Wallet,
  X,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useActiveBusiness } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/lib/theme';
import { ADMIN_EMAILS } from '@/lib/constants';

const moreLinks = [
  { to: '/profile', label: 'My Profile', icon: UserCircle },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/services', label: 'Services', icon: Scissors },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export function MoreMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const active = useActiveBusiness();
  const user = useAuthStore((s) => s.user);
  const [theme, setTheme] = useTheme();
  const isAdmin = Boolean(
    user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase() as never),
  );
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={active?.name ?? 'Menu'}
      description={active ? `Manage ${active.name}` : undefined}
    >
      <div className="space-y-1">
        <div
          onClick={() => {
            onOpenChange(false);
            navigate('/profile');
          }}
          className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl bg-surface-2 p-3 transition-colors hover:bg-surface-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-sm font-medium text-accent">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.fullName?.charAt(0).toUpperCase() ?? '?'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.fullName ?? ''}
            </p>
            <p className="truncate text-xs text-foreground-5">{user?.email ?? ''}</p>
          </div>
        </div>
        {moreLinks.map((link) => (
          <button
            key={link.to}
            onClick={() => {
              onOpenChange(false);
              navigate(link.to);
            }}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-foreground-3 transition-colors hover:bg-surface-2"
          >
            <link.icon className="h-5 w-5 text-foreground-5" aria-hidden />
            {link.label}
          </button>
        ))}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-foreground-3 transition-colors hover:bg-surface-2"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-foreground-5" aria-hidden />
          ) : (
            <Moon className="h-5 w-5 text-foreground-5" aria-hidden />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={() => {
            onOpenChange(false);
            navigate('/onboarding');
          }}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-foreground-3 transition-colors hover:bg-surface-2"
        >
          <Store className="h-5 w-5 text-foreground-5" aria-hidden />
          Add another business
        </button>
        {isAdmin && (
          <button
            onClick={() => {
              onOpenChange(false);
              navigate('/admin');
            }}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent-soft"
          >
            <ShieldCheck className="h-5 w-5" aria-hidden />
            Platform admin
          </button>
        )}
        <button
          onClick={() => {
            onOpenChange(false);
            logout();
            navigate('/login');
          }}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
        >
          <X className="h-5 w-5" aria-hidden />
          Log out
        </button>
      </div>
    </Dialog>
  );
}
