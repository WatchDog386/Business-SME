import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DuoCalls,
  DuoCustomers,
  DuoExpenses,
  DuoProducts,
  DuoReports,
  DuoSales,
  DuoServices,
  DuoStaff,
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
  { to: '/staff', label: 'Staff', icon: DuoStaff },
];

/**
 * Quick actions use a distinct Optimas colour for each icon while keeping the
 * original neutral tiles. `onSelect` turns the tiles into buttons for the subscriber app.
 */
const actionTones = [
  'text-[#2F7F81] [.dark_&]:text-[#78C8C9]',
  'text-[#B45309] [.dark_&]:text-[#FDBA74]',
  'text-[#4F46E5] [.dark_&]:text-[#A5B4FC]',
  'text-[#7C3AED] [.dark_&]:text-[#C4B5FD]',
  'text-[#2563EB] [.dark_&]:text-[#93C5FD]',
  'text-[#A16207] [.dark_&]:text-[#FCD34D]',
  'text-[#0E7490] [.dark_&]:text-[#67E8F9]',
  'text-[#BE185D] [.dark_&]:text-[#F9A8D4]',
  'text-[#0F766E] [.dark_&]:text-[#5EEAD4]',
] as const;

export function QuickActions({
  items = actions,
  viewAll = true,
  onSelect,
  onManage,
  labelClassName,
  titleClassName,
  className,
}: {
  items?: QuickAction[];
  viewAll?: boolean;
  onSelect?: (to: string) => void;
  /** Where the "Manage" button goes. Without it the button opens the staff section menu. */
  onManage?: () => void;
  /** Label colour, so the same tiles can sit on the subscriber's dark panel. */
  labelClassName?: string;
  titleClassName?: string;
  className?: string;
} = {}) {
  const [allOpen, setAllOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <section className={cn('px-0.5', className)}>
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <h2 className={cn('text-[17px] font-semibold tracking-tight text-foreground', titleClassName)}>Quick Actions</h2>
        {viewAll && (
        <button
          type="button"
          onClick={onManage ?? (() => setAllOpen(true))}
          className="flex h-9 items-center rounded-full border-2 border-edge-2 px-5 text-[15px] font-semibold text-brand-600 transition-transform active:scale-95 active:opacity-70 [.dark_&]:text-brand-400"
        >
          Manage
        </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-x-1 gap-y-4">
        {items.map((action, i) => {
          const iconTone = actionTones[i % actionTones.length];
          return (
            <motion.button
              key={action.to}
              type="button"
              onClick={() => (onSelect ? onSelect(action.to) : navigate(action.to))}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.03, type: 'spring', stiffness: 420, damping: 30 }}
              whileTap={{ scale: 0.88 }}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-3 [.dark_&]:bg-[#333333]">
                {/* All paths inherit this action's colour, including the small icon details. */}
                <action.icon className={cn('h-7 w-7', iconTone)} />
              </span>
              <span className={cn('line-clamp-2 text-center text-[13px] leading-snug text-foreground', labelClassName)}>
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {viewAll && !onManage && <MoreMenu open={allOpen} onOpenChange={setAllOpen} />}
    </section>
  );
}
