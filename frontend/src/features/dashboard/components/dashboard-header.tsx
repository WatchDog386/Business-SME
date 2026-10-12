import { useState } from 'react';
import { DuoBell, DuoMenu, DuoSearch } from '@/components/brand/duo-icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useActiveBusiness } from '@/stores/business';
import { useNotifications } from '@/features/notifications/notifications-shared';
import { SearchDialog } from './search-dialog';
import { MoreMenu } from '@/components/layout/more-menu';
import { SettingsPage } from '@/components/layout/settings-page';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const active = useActiveBusiness();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Only notifications not yet read on this device
  const { unread: notificationCount } = useNotifications();

  return (
    <>
      <header className="page-head dash-glow-head flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-medium text-white ring-2 ring-white transition-transform active:scale-95 shadow-[0_6px_18px_-6px_rgba(37,99,235,0.28),0_1px_2px_rgba(15,23,42,0.06)] [.dark_&]:ring-0"
            aria-label="Open menu"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : active?.logo_url ? (
              <img src={active.logo_url} alt="Business logo" className="h-full w-full object-cover" />
            ) : active ? (
              active.name.charAt(0).toUpperCase()
            ) : (
              user?.fullName?.charAt(0).toUpperCase() ?? '?'
            )}
          </button>
          <div className="leading-tight">
            <p className="text-[13px] font-medium text-foreground-3">
              {greeting()} · {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <h1 className="text-lg sm:text-xl font-medium tracking-tight text-foreground flex items-center gap-1.5">
              {user?.fullName ? user.fullName.split(' ')[0] : 'User'} <motion.span
                className="inline-block origin-[70%_70%]"
                animate={{ rotate: [0, 18, -8, 18, 0] }}
                transition={{ duration: 1.2, delay: 0.4 }}
              >
                👋
              </motion.span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 shadow-[0_6px_18px_-6px_rgba(37,99,235,0.28),0_1px_2px_rgba(15,23,42,0.06)] transition-transform active:scale-90 [.dark_&]:bg-[#1E1E1E] [.dark_&]:shadow-none"
            aria-label={
              notificationCount > 0
                ? `Notifications (${notificationCount} unread)`
                : 'Notifications'
            }
          >
            {/* A short wiggle when something needs attention */}
            <motion.span
              animate={notificationCount > 0 ? { rotate: [0, -14, 12, -8, 5, 0] } : { rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.6, repeat: notificationCount > 0 ? Infinity : 0, repeatDelay: 6 }}
              className="flex"
            >
              <DuoBell className="h-6 w-6 text-brand-600 [.dark_&]:text-brand-400" />
            </motion.span>
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-surface">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 shadow-[0_6px_18px_-6px_rgba(37,99,235,0.28),0_1px_2px_rgba(15,23,42,0.06)] transition-transform active:scale-90 [.dark_&]:bg-[#1E1E1E] [.dark_&]:text-brand-400 [.dark_&]:shadow-none"
            aria-label="Settings"
          >
            <DuoMenu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Search bar — dull outstanding field like admin toolbar */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-full border border-white/80 bg-white/85 px-4 py-3.5 text-left shadow-[0_6px_18px_-6px_rgba(37,99,235,0.28),0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur transition-transform active:scale-[0.99] [.dark_&]:border-transparent [.dark_&]:bg-surface-3 [.dark_&]:shadow-none"
        aria-label="Search products, customers and sales"
      >
        <DuoSearch className="h-5 w-5 shrink-0 text-brand-600 [.dark_&]:text-brand-400" />
        <span className="truncate text-sm text-foreground-4">
          Search products, customers, sales…
        </span>
      </button>


      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <MoreMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <SettingsPage open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
