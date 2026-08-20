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
    color: 'bg-emerald-500 text-white shadow-emerald-500/20',
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
    color: 'bg-blue-500 text-white shadow-blue-500/20',
  },
  {
    to: '/products?new=1',
    label: 'Add Product',
    icon: PackagePlus,
    color: 'bg-purple-500 text-white shadow-purple-500/20',
  },
  {
    to: '/services?new=1',
    label: 'Add Service',
    icon: Wrench,
    color: 'bg-teal-500 text-white shadow-teal-500/20',
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
      <h2 className="text-base font-bold text-foreground tracking-tight">Quick Actions</h2>
      <div className="overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#1E1E1E] p-6 shadow-xl text-white">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {actions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="group flex flex-col items-center gap-2 text-center transition-transform active:scale-95"
            >
              <div
                className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full ${action.color} shadow-md transition-all group-hover:scale-105 group-hover:shadow-lg`}
              >
                <action.icon className="h-6 w-6" aria-hidden />
              </div>
              <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors line-clamp-1">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
