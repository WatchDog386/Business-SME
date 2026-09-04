import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { apiErrorMessage } from '@/api/client';
import { cn } from '@/lib/utils';
import {
  buildNotifications,
  type NotificationCategory,
  type NotificationItem,
} from './notifications-shared';

type Category = NotificationCategory;

const tabs: Array<{ id: Category; label: string }> = [
  { id: 'promotions', label: 'Promotions' },
  { id: 'stock', label: 'Stock' },
  { id: 'sales', label: 'Sales' },
];

const toneClasses: Record<NotificationItem['tone'], string> = {
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Category>('stock');
  const [readIds, setReadIds] = useState<Set<string>>(new Set(['platform-active']));

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
  });

  const notifications = useMemo<NotificationItem[]>(
    () => (data ? buildNotifications(data) : []),
    [data],
  );

  const filtered = useMemo(
    () => notifications.filter((n) => n.category === activeTab),
    [notifications, activeTab],
  );

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const open = (item: NotificationItem) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    navigate(item.link);
  };

  if (isLoading) {
    return <PageLoader inline message="Loading" />;
  }

  if (error || !data) {
    return (
      <Alert variant="error" title="Could not load notifications">
        {apiErrorMessage(error)}
      </Alert>
    );
  }

  return (
    <div className="space-y-4 pb-10 font-sans text-[14px]">
      {/* App bar — back arrow | centered title | mark all read */}
      <div className="relative flex h-12 items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground transition-colors hover:bg-surface-3 active:bg-surface-3"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium tracking-tight text-foreground">
          Notifications
        </h1>

        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="shrink-0 rounded-full px-3 py-2 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100"
        >
          Mark all as read
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center justify-center gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'h-9 w-28 rounded-full border text-xs font-medium tracking-wide transition-all active:scale-[0.97]',
                isActive
                  ? 'border-brand-700 bg-brand-700 text-white shadow-sm'
                  : 'border-edge bg-surface text-foreground-2 hover:bg-surface-2',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="relative">
            <Bell className="h-24 w-24 text-accent" strokeWidth={1.25} aria-hidden />
            <span
              className="absolute -right-1 top-0 h-3 w-3 rounded-full bg-accent"
              aria-hidden
            />
            <span
              className="absolute -left-2 bottom-8 h-2 w-2 rounded-full bg-accent/40"
              aria-hidden
            />
          </div>

          <h2 className="mt-8 text-sm font-medium tracking-tight text-foreground">
            It looks like you're starting fresh here.
          </h2>
          <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-foreground-2">
            You have no notifications.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-edge bg-surface shadow-sm">
          {filtered.map((item, index) => {
            const unread = !readIds.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => open(item)}
                className={cn(
                  'group flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-3',
                  index !== filtered.length - 1 && 'border-b border-edge',
                )}
              >
                <span
                  className={cn(
                    'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-active:scale-95',
                    toneClasses[item.tone],
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden />
                  {unread && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-sm text-foreground',
                        unread ? 'font-medium' : 'font-medium text-foreground-2',
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium text-foreground-5">
                      {item.time}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-foreground-3 line-clamp-2">
                    {item.text}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
