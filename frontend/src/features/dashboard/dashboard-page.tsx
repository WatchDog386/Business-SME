import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScanLine } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { apiErrorMessage } from '@/api/client';
import { DashboardHeader } from './components/dashboard-header';
import { FeaturedCard } from './components/featured-card';
import { SalesChart } from './components/sales-chart';
import { QuickActions } from './components/quick-actions';
import { AdsBanner } from './components/ads-banner';
import { ScanSaleDialog } from './components/scan-sale-dialog';

import { TopProducts } from './components/top-products';

export function DashboardPage() {
  const [scanOpen, setScanOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-48 rounded-[28px]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="error" title="Could not load your dashboard">
        {apiErrorMessage(error)}
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-2">
      <DashboardHeader />
      <FeaturedCard data={data} />
      <QuickActions />
      <TopProducts products={data.topProducts} />
      <AdsBanner />
      <SalesChart series={data.salesSeries} weekRevenue={data.weekRevenue} />

      {/* Floating scan-to-record-sale action */}
      <button
        onClick={() => setScanOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-brand-700 pl-4 pr-5 text-white shadow-sm transition-transform active:scale-95"
        aria-label="Scan to record sale"
      >
        <ScanLine className="h-5 w-5" />
        <span className="text-sm font-medium">Scan sale</span>
      </button>
      <ScanSaleDialog open={scanOpen} onOpenChange={setScanOpen} />
    </div>
  );
}
