import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { apiErrorMessage } from '@/api/client';
import { DashboardHeader } from './components/dashboard-header';
import { FeaturedCard } from './components/featured-card';
import { KpiCards } from './components/kpi-cards';
import { SalesChart } from './components/sales-chart';
import { QuickActions } from './components/quick-actions';
import { AdsBanner } from './components/ads-banner';
import { RecentTransactions } from './components/recent-transactions';
import { TopProducts } from './components/top-products';

export function DashboardPage() {
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
    <div className="space-y-6">
      <DashboardHeader />
      <FeaturedCard data={data} />
      <QuickActions />
      <KpiCards data={data} />
      <SalesChart series={data.salesSeries} weekRevenue={data.weekRevenue} />
      <AdsBanner />
      <RecentTransactions transactions={data.recentTransactions} />
      <TopProducts products={data.topProducts} />
    </div>
  );
}
