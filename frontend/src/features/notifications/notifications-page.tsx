import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PackageX, Wallet, CalendarClock, Bell, CheckCircle2, ArrowLeft } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { apiErrorMessage } from '@/api/client';
import { EmptyState } from '@/components/ui/empty-state';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="error" title="Could not load notifications">
        {apiErrorMessage(error)}
      </Alert>
    );
  }

  const notifications: Array<{
    id: string;
    icon: typeof PackageX;
    title: string;
    text: string;
    tone: 'warning' | 'danger' | 'info' | 'success';
    link: string;
    time: string;
  }> = [];

  if (data.lowStock > 0) {
    notifications.push({
      id: 'low-stock',
      icon: PackageX,
      title: 'Low Stock Alert',
      text: `${data.lowStock} product${data.lowStock === 1 ? ' is' : 's are'} running low on stock. Restock soon to avoid losing sales.`,
      tone: 'warning',
      link: '/products',
      time: 'Today',
    });
  }

  const debtors = data.recentCustomers.filter((c) => c.outstanding_balance > 0);
  if (debtors.length > 0) {
    const total = debtors.reduce((acc, c) => acc + c.outstanding_balance, 0);
    notifications.push({
      id: 'debtors',
      icon: Wallet,
      title: 'Outstanding Customer Credit',
      text: `${debtors.length} customer${debtors.length === 1 ? '' : 's'} owe a total of KSh ${total.toLocaleString('en-KE')}.`,
      tone: 'danger',
      link: '/customers',
      time: 'Recent',
    });
  }

  if (data.appointmentsToday > 0) {
    notifications.push({
      id: 'appointments',
      icon: CalendarClock,
      title: 'Appointments Today',
      text: `${data.appointmentsToday} service appointment${data.appointmentsToday === 1 ? '' : 's'} scheduled for today.`,
      tone: 'info',
      link: '/reports',
      time: 'Today',
    });
  }

  notifications.push({
    id: 'welcome',
    icon: CheckCircle2,
    title: 'Platform Active',
    text: 'Your Biashara platform is fully synchronized and running smoothly.',
    tone: 'success',
    link: '/dashboard',
    time: 'System',
  });

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-foreground transition-colors hover:bg-surface-3"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          <p className="text-xs text-foreground-5">Important alerts and updates for your business</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Important alerts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.link)}
              className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-edge bg-surface p-4 shadow-sm transition-all hover:border-accent hover:shadow-md"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  item.tone === 'warning'
                    ? 'bg-warning-soft text-warning'
                    : item.tone === 'danger'
                    ? 'bg-danger-soft text-danger'
                    : item.tone === 'info'
                    ? 'bg-info-soft text-info'
                    : 'bg-success-soft text-success'
                }`}
              >
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                    {item.title}
                  </p>
                  <span className="text-xs text-foreground-5">{item.time}</span>
                </div>
                <p className="mt-1 text-xs text-foreground-3 leading-relaxed">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
