import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SettingsPage } from '@/components/layout/settings-page';
import { HeaderAccountPage } from '@/components/layout/header-account-page';
import { DuoScan, DuoSearch } from '@/components/brand/duo-icons';
import { useAuthStore } from '@/stores/auth';
import { useActiveBusiness } from '@/stores/business';
import { useNotifications } from '@/features/notifications/notifications-shared';
import { SearchDialog } from './search-dialog';
import { ScanSaleDialog } from './scan-sale-dialog';

/** Dark top bar with the account menu, search, scan, notifications and settings. */
export function DashboardHeader() {
  const user = useAuthStore((s) => s.user);
  const active = useActiveBusiness();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { unread: notificationCount } = useNotifications();
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  return (
    <>
      <div className="dashboard-header-slot">
        <header className="dashboard-header flex items-center justify-between gap-3 text-white">
          <button
            onClick={() => setAccountOpen(true)}
            className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/90 bg-[radial-gradient(circle_at_30%_25%,#9BE15D_0%,#4CAF2E_38%,#2E7D1A_70%,#174D0C_100%)] shadow-[0_4px_10px_rgba(0,0,0,0.45), inset_0_-3px_6px_rgba(0,0,0,0.35)] transition-transform active:scale-95"
            aria-label="Open account options"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : active?.logo_url ? (
              <img src={active.logo_url} alt="Business logo" className="h-full w-full object-cover" />
            ) : (
              <>
                {/* Glossy shine across the top of the badge */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-1.5 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/45 to-white/0"
                />
                {/* Heavy, slanted initial with a soft drop shadow */}
                <span className="relative -skew-x-12 text-[26px] font-black leading-none text-white [text-shadow:0_2px_3px_rgba(0,0,0,0.45)]">
                  {(user?.fullName ?? active?.name ?? '?').charAt(0).toUpperCase()}
                </span>
              </>
            )}
          </button>

          <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-medium tracking-tight">
            Hello {firstName}{' '}
            <motion.span
              className="inline-block origin-[70%_70%]"
              animate={{ rotate: [0, 18, -8, 18, 0] }}
              transition={{ duration: 1.2, delay: 0.4 }}
              aria-hidden
            >
              👋
            </motion.span>
          </h1>

          <div className="dashboard-header-actions flex shrink-0 items-center gap-3 pr-1">
            <button type="button" onClick={() => setScanOpen(true)} className="flex h-9 w-9 items-center justify-center text-white transition-transform active:scale-90" aria-label="Scan to record a sale">
              <DuoScan mono className="h-7 w-7" />
            </button>
            <button
              onClick={() => navigate('/notifications')}
              type="button"
              className="relative flex h-8 w-8 items-center justify-center text-white/90 transition-transform active:scale-90"
              aria-label={notificationCount > 0 ? `Notifications (${notificationCount} unread)` : 'Notifications'}
            >
              <motion.span
                animate={notificationCount > 0 ? { rotate: [0, -14, 12, -8, 5, 0] } : { rotate: 0 }}
                transition={{ duration: 0.9, delay: 0.6, repeat: notificationCount > 0 ? Infinity : 0, repeatDelay: 6 }}
                className="flex"
              >
                <Bell className="h-5 w-5" strokeWidth={1.9} aria-hidden />
              </motion.span>
              {/* Red count of unread notifications */}
              {notificationCount > 0 && (
                <motion.span
                  key={notificationCount}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-1.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-black/40"
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </motion.span>
              )}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              type="button"
              className="flex h-8 w-8 items-center justify-center text-white/90 transition-transform active:scale-90"
              aria-label="Open settings"
            >
              <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        </header>
        <div className="dashboard-header-spacer" aria-hidden="true" />
      </div>

      {/* Search bar, below the header */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-full border border-white/80 bg-white/85 px-4 py-3.5 text-left shadow-[0_6px_18px_-6px_rgba(37,99,235,0.28),0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur transition-transform active:scale-[0.99] [.dark_&]:border-transparent [.dark_&]:bg-surface-3 [.dark_&]:shadow-none"
        aria-label="Search products, customers and sales"
      >
        <DuoSearch className="h-5 w-5 shrink-0 text-brand-600 [.dark_&]:text-brand-400" />
        <span className="truncate text-sm text-foreground-4">Search products, customers, sales…</span>
      </button>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <ScanSaleDialog open={scanOpen} onOpenChange={setScanOpen} />
      <HeaderAccountPage open={accountOpen} onOpenChange={setAccountOpen} />
      <SettingsPage open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
