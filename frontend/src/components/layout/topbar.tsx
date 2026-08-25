import { useNavigate } from 'react-router-dom';
import {
  ChevronsUpDown,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { useActiveBusiness, useBusinessStore } from '@/stores/business';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ThemeToggle } from './theme-toggle';

export function Topbar() {
  return (
    <header className="hidden sm:flex sticky top-0 z-30 h-16 items-center justify-between gap-3 border-b border-edge bg-surface-2/90 px-6 backdrop-blur">
      <BusinessSwitcher />
      <ThemeToggle />
    </header>
  );
}

export function BusinessSwitcher() {
  const [open, setOpen] = useState(false);
  const businesses = useBusinessStore((s) => s.businesses);
  const selectBusiness = useBusinessStore((s) => s.selectBusiness);
  const active = useActiveBusiness();
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
        aria-label="Switch business"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-sm font-medium text-accent">
          {active?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="max-w-[160px] truncate text-sm font-medium text-foreground">
            {active?.name ?? 'Select business'}
          </p>
          <p className="text-[10px] text-foreground-5">
            {active ? 'Switch business' : 'No business yet'}
          </p>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-foreground-5" aria-hidden />
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Switch business"
        description="Choose which business you want to manage."
      >
        <div className="space-y-2">
          {businesses.map((business) => {
            const isActive = business.id === active?.id;
            return (
              <button
                key={business.id}
                onClick={() => {
                  selectBusiness(business);
                  setOpen(false);
                  navigate('/dashboard');
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-full border px-3 py-3 text-left transition-colors',
                  isActive
                    ? 'border-accent-border bg-accent-soft'
                    : 'border-edge hover:bg-surface-2',
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-sm font-medium text-accent">
                  {business.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {business.name}
                  </p>
                  <p className="text-xs text-foreground-5">
                    {business.business_type} · {business.county ?? '—'}
                  </p>
                </div>
                {isActive && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setOpen(false);
              navigate('/onboarding');
            }}
          >
            <Plus className="h-4 w-4" />
            Add another business
          </Button>
        </div>
      </Dialog>
    </>
  );
}