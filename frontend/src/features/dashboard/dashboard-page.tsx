import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import { Alert } from '@/components/ui/alert';
import { apiErrorMessage } from '@/api/client';
import { DashboardHeader } from './components/dashboard-header';
import { FeaturedCard } from './components/featured-card';
import { SalesChart } from './components/sales-chart';
import { QuickActions } from './components/quick-actions';
import { AdsBanner } from './components/ads-banner';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-2 animate-fade-in">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-40 rounded-2xl" />
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
      <AdsBanner />
      <SalesChart series={data.salesSeries} weekRevenue={data.weekRevenue} />
      <div className="flex items-center gap-3 rounded-3xl border border-brand-800 bg-brand-700 px-4 py-3 shadow-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-white" aria-hidden />
        <p className="text-xs leading-relaxed text-white">
          © 2024 Kenya SME Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}