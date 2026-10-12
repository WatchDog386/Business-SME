import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import {
  DuoCalls,
  DuoCustomers,
  DuoExpenses,
  DuoProducts,
  DuoReports,
  DuoSales,
  DuoServices,
  DuoSubscribers,
} from '@/components/brand/duo-icons';
import { MoreMenu } from '@/components/layout/more-menu';

export type QuickAction = { to: string; label: string; icon: (props: { className?: string }) => JSX.Element };

const actions: QuickAction[] = [
  { to: '/sales', label: 'Sales', icon: DuoSales },
  { to: '/expenses', label: 'Expenses', icon: DuoExpenses },
  { to: '/customers', label: 'Customers', icon: DuoCustomers },
  { to: '/products', label: 'Products', icon: DuoProducts },
  { to: '/services', label: 'Services', icon: DuoServices },
  { to: '/reports', label: 'Reports', icon: DuoReports },
  { to: '/subscribers', label: 'Subscribers', icon: DuoSubscribers },
  { to: '/calls', label: 'Calls', icon: DuoCalls },
];

const MotionLink = motion(Link);

/**
 * Safaricom-app "Quick Actions", straight on the page background: title with a green
 * "View all" (opens every section), round grey tiles with green-and-red icons.
 */
export function QuickActions({ items = actions, viewAll = true }: { items?: QuickAction[]; viewAll?: boolean } = {}) {
  const [allOpen, setAllOpen] = useState(false);

  return (
    <section className="px-0.5">
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground">Quick Actions</h2>
        {viewAll && (
        <button
          type="button"
          onClick={() => setAllOpen(true)}
          className="flex items-center gap-1 text-[15px] font-medium text-brand-600 active:opacity-60 [.dark_&]:text-brand-400"
        >
          View all
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-x-1 gap-y-4">
        {items.map((action, i) => (
          <MotionLink
            key={action.to}
            to={action.to}
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.03, type: 'spring', stiffness: 420, damping: 30 }}
            whileTap={{ scale: 0.88 }}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-3 text-brand-600 [.dark_&]:bg-[#333333] [.dark_&]:text-brand-400">
              <action.icon className="h-7 w-7" />
            </span>
            <span className="line-clamp-2 text-center text-[13px] leading-snug text-foreground">{action.label}</span>
          </MotionLink>
        ))}
      </div>

      <MoreMenu open={allOpen} onOpenChange={setAllOpen} />
    </section>
  );
}
