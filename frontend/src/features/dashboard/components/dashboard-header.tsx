import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useActiveBusiness } from '@/stores/business';
import { dashboardApi } from '@/api/endpoints';
import { buildNotifications } from '@/features/notifications/notifications-shared';
import { SearchDialog } from './search-dialog';
import { MoreMenu } from '@/components/layout/more-menu';
import { SettingsPage } from '@/components/layout/settings-page';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const quickLinks = [
  { label: 'Products', to: '/products' },
  { label: 'Services', to: '/services' },
  { label: 'Customers', to: '/customers' },
];

export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const active = useActiveBusiness();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });
  const notificationCount = data ? buildNotifications(data).length : 0;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-medium text-white transition-transform active:scale-95 shadow-md shadow-indigo-500/30"
            aria-label="Open menu"
          >
            {active?.logo_url ? (
              <img src={active.logo_url} alt="Business logo" className="h-full w-full object-cover" />
            ) : active ? (
              active.name.charAt(0).toUpperCase()
            ) : user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.fullName?.charAt(0).toUpperCase() ?? '?'
            )}
          </button>
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-foreground-3">
              {greeting()},
            </p>
            <h1 className="text-lg sm:text-xl font-medium tracking-tight text-foreground flex items-center gap-1.5">
              {user?.fullName ? user.fullName.split(' ')[0] : 'User'} <span className="inline-block">👋</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex h-12 w-12 items-center justify-center rounded-full text-foreground-2 transition-colors hover:bg-surface-2 hover:text-indigo-600"
            aria-label={
              notificationCount > 0
                ? `Notifications (${notificationCount} unread)`
                : 'Notifications'
            }
          >
            <Bell className="h-6 w-6" strokeWidth={2.5} aria-hidden />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-surface">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full text-foreground-2 transition-colors hover:bg-surface-2 hover:text-accent active:bg-surface-3"
            aria-label="Settings"
          >
            <Settings className="h-6 w-6" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      </header>

      {/* Search bar */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-full border border-edge bg-surface px-4 py-2.5 text-left shadow-soft transition-colors hover:border-accent-border active:bg-surface-2"
        aria-label="Search products, customers and sales"
      >
        <Search className="h-4 w-4 shrink-0 text-foreground-4" aria-hidden />
        <span className="truncate text-sm text-foreground-4">
          Search products, customers, sales…
        </span>
      </button>

      {/* Quick browse chips */}
      <div className="scrollbar-none flex items-center justify-center gap-2">
        {/* All — stays on the dashboard, solid green to show it's active */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="min-w-[86px] shrink-0 rounded-full border border-transparent bg-accent px-4 py-1.5 text-center text-[13px] font-medium text-white transition-all active:scale-95"
        >
          All
        </button>
        {quickLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.to)}
            className={cn(
              'min-w-[86px] shrink-0 rounded-full border border-edge bg-surface px-4 py-1.5 text-center text-[13px] font-medium text-foreground-2 transition-all active:scale-95',
              'hover:border-accent hover:bg-accent hover:text-white',
            )}
          >
            {link.label}
          </button>
        ))}
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <MoreMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <SettingsPage open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
