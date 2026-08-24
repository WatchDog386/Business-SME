import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Wallet,
  UserPlus,
  PackagePlus,
  Wrench,
  BarChart3,
} from 'lucide-react';

const actions = [
  {
    to: '/sales/new',
    label: 'Record Sale',
    icon: ShoppingCart,
    color: 'bg-teal-500 text-white shadow-teal-500/20',
  },
  {
    to: '/expenses?new=1',
    label: 'Add Expense',
    icon: Wallet,
    color: 'bg-amber-500 text-white shadow-amber-500/20',
  },
  {
    to: '/customers?new=1',
    label: 'Add Customer',
    icon: UserPlus,
    color: 'bg-sky-500 text-white shadow-sky-500/20',
  },
  {
    to: '/products?new=1',
    label: 'Add Product',
    icon: PackagePlus,
    color: 'bg-violet-500 text-white shadow-violet-500/20',
  },
  {
    to: '/services?new=1',
    label: 'Add Service',
    icon: Wrench,
    color: 'bg-rose-500 text-white shadow-rose-500/20',
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    color: 'bg-indigo-500 text-white shadow-indigo-500/20',
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h2 className="text-[14px] font-medium tracking-tight text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-6">
        {actions.map((action) => (
          <button
            key={action.to}
            onClick={() => navigate(action.to)}
            className="group flex flex-col items-center gap-2 text-center transition-transform active:scale-95"
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${action.color} shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg`}
            >
              <action.icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-foreground-2 transition-colors group-hover:text-accent line-clamp-1">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
