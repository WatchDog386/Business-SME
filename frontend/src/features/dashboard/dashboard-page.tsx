import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/endpoints';
import { Alert } from '@/components/ui/alert';
import { apiErrorMessage } from '@/api/client';
import { DashboardHeader } from './components/dashboard-header';
import { FeaturedCard } from './components/featured-card';
import { SalesChart } from './components/sales-chart';
import { QuickActions } from './components/quick-actions';
import { AdsBanner } from './components/ads-banner';

export function DashboardPage() {
  const { data, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

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
      <footer className="bg-emerald-600 text-white py-4 text-center">
        <p className="text-sm">© 2024 Kenya SME Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}