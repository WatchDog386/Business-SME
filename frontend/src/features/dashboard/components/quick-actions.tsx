import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingCart, Wallet, UserPlus, PackagePlus, Wrench, BarChart3 } from 'lucide-react';

const actions = [
  {
    to: '/sales/new',
    label: 'Record Sale',
    hint: 'Log a new transaction',
    icon: ShoppingCart,
    iconClass: 'bg-teal-500 text-white',
  },
  {
    to: '/expenses?new=1',
    label: 'Add Expense',
    hint: 'Track business costs',
    icon: Wallet,
    iconClass: 'bg-amber-500 text-white',
  },
  {
    to: '/customers?new=1',
    label: 'Add Customer',
    hint: 'New client profile',
    icon: UserPlus,
    iconClass: 'bg-sky-500 text-white',
  },
  {
    to: '/products?new=1',
    label: 'Add Product',
    hint: 'New inventory item',
    icon: PackagePlus,
    iconClass: 'bg-violet-500 text-white',
  },
  {
    to: '/services?new=1',
    label: 'Add Service',
    hint: 'New service offering',
    icon: Wrench,
    iconClass: 'bg-rose-500 text-white',
  },
  {
    to: '/reports',
    label: 'Reports',
    hint: 'Sales & insights',
    icon: BarChart3,
    iconClass: 'bg-indigo-500 text-white',
  },
];

function QuickLink({ to, icon, label, hint, iconClass }: { to: string; icon: React.ReactNode; label: string; hint: string; iconClass: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between rounded-2xl bg-surface-3 p-4 transition-colors hover:bg-surface-2 active:scale-[0.99]"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-foreground truncate">
            {label}
          </span>
          <span className="block text-[11px] text-foreground-4 truncate">{hint}</span>
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-foreground-5 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
    </Link>
  );
}

export function QuickActions() {
  const [showAll, setShowAll] = useState(false);
  const visibleActions = showAll ? actions : actions.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-medium tracking-tight text-foreground">Quick Actions</h2>
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
        >
          {showAll ? 'Show less' : 'View all'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleActions.map((action) => (
          <QuickLink
            key={action.to}
            to={action.to}
            icon={<action.icon className="h-4.5 w-4.5" aria-hidden />}
            label={action.label}
            hint={action.hint}
            iconClass={action.iconClass}
          />
        ))}
      </div>
    </div>
  );
}