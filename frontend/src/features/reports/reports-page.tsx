import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DateRangeField, useDateRange } from './date-range';
import { ProfitLossPanel } from './profit-loss-panel';
import { DailySummaryPanel } from './daily-summary-panel';
import { ProductPerformancePanel } from './product-performance-panel';

const tabs = [
  { id: 'profit', label: 'Profit & loss' },
  { id: 'daily', label: 'Daily summary' },
  { id: 'products', label: 'Top products' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function ReportsPage() {
  const [active, setActive] = useState<TabId>('profit');
  const range = useDateRange();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="See your profit clearly — revenue, costs and what you actually keep."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-surface-2 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active === tab.id
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'text-foreground-5 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <DateRangeField
          from={range.from}
          to={range.to}
          onFromChange={range.setFrom}
          onToChange={range.setTo}
        />
      </div>

      {active === 'profit' && <ProfitLossPanel from={range.from} to={range.to} />}
      {active === 'daily' && <DailySummaryPanel from={range.from} to={range.to} />}
      {active === 'products' && (
        <ProductPerformancePanel from={range.from} to={range.to} />
      )}
    </div>
  );
}
