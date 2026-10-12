import { useMemo, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlarmClock,
  ClipboardCheck,
  FileBarChart2,
  PackageX,
  PhoneCall,
  PiggyBank,
  Wallet,
  WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { dashboardApi } from '@/api/endpoints';
import type { DashboardData } from '@/api/types';
import { useRole } from '@/hooks/use-role';

export type NotificationCategory = 'subscribers' | 'money' | 'expenses' | 'reports' | 'stock';

export interface NotificationItem {
  /**
   * Stable while the situation is the same; changes when it changes (e.g. the
   * number of expiring clients), so a new situation shows as unread again.
   */
  id: string;
  category: NotificationCategory;
  icon: LucideIcon;
  tone: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  text: string;
  time: string;
  link: string;
}

const TZ = 'Africa/Nairobi';
const isoDay = (offset = 0) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(Date.now() + offset * 86_400_000),
  );

/** Notifications built from live dashboard data: only things that need attention. */
export function buildNotifications(data: DashboardData, options: { canApprove?: boolean } = {}): NotificationItem[] {
  const today = isoDay();
  const yesterday = isoDay(-1);
  const items: NotificationItem[] = [];
  const subs = data.subscribers;

  // Subscribers
  if (subs && subs.expired > 0) {
    items.push({
      id: `expired-${subs.expired}-${today}`,
      category: 'subscribers',
      icon: WifiOff,
      tone: 'danger',
      title: `${subs.expired} WiFi package${subs.expired === 1 ? ' has' : 's have'} expired`,
      text: 'These clients are disconnected until they renew. Call or message them.',
      time: 'Today',
      link: '/subscribers',
    });
  }
  if (subs && subs.expiringSoon > 0) {
    items.push({
      id: `expiring-${subs.expiringSoon}-${today}`,
      category: 'subscribers',
      icon: AlarmClock,
      tone: 'warning',
      title: `${subs.expiringSoon} package${subs.expiringSoon === 1 ? '' : 's'} expiring soon`,
      text: 'Remind these clients to renew before they lose their connection.',
      time: 'Today',
      link: '/subscribers',
    });
  }
  if ((data.callsDue ?? 0) > 0) {
    items.push({
      id: `calls-${data.callsDue}-${today}`,
      category: 'subscribers',
      icon: PhoneCall,
      tone: 'info',
      title: `${data.callsDue} client call${data.callsDue === 1 ? '' : 's'} due today`,
      text: 'Call-backs, renewals and balances to follow up.',
      time: 'Today',
      link: '/calls',
    });
  }

  // Money owed
  if (data.outstandingDebts > 0) {
    items.push({
      id: `owed-${data.outstandingDebts}`,
      category: 'money',
      icon: Wallet,
      tone: 'danger',
      title: 'Clients owe you money',
      text: `KSh ${data.outstandingDebts.toLocaleString('en-KE')} is unpaid across client balances.`,
      time: 'Now',
      link: '/customers',
    });
  }

  // Expenses
  if (options.canApprove && data.pendingApprovals > 0) {
    items.push({
      id: `approvals-${data.pendingApprovals}`,
      category: 'expenses',
      icon: ClipboardCheck,
      tone: 'warning',
      title: 'Expenses awaiting approval',
      text: `${data.pendingApprovals} staff expense${data.pendingApprovals === 1 ? ' needs' : 's need'} your review.`,
      time: 'Now',
      link: '/expenses?status=PENDING',
    });
  }
  for (const budget of data.budgetAlerts ?? []) {
    const over = budget.level === 'EXCEEDED';
    items.push({
      id: `budget-${budget.id}-${budget.level}`,
      category: 'expenses',
      icon: PiggyBank,
      tone: over ? 'danger' : 'warning',
      title: over ? `${budget.category_name} over budget` : `${budget.category_name} near budget`,
      text: `KSh ${budget.spent.toLocaleString('en-KE')} spent of KSh ${budget.limit.toLocaleString('en-KE')} this month (${budget.percent}%).`,
      time: 'This month',
      link: '/budgets',
    });
  }

  // Stock
  if (data.lowStock > 0) {
    items.push({
      id: `low-stock-${data.lowStock}`,
      category: 'stock',
      icon: PackageX,
      tone: 'warning',
      title: 'Low stock',
      text: `${data.lowStock} product${data.lowStock === 1 ? ' is' : 's are'} running low. Restock soon.`,
      time: 'Today',
      link: '/products',
    });
  }

  // Yesterday's daily report, every morning
  items.push({
    id: `report-${yesterday}`,
    category: 'reports',
    icon: FileBarChart2,
    tone: 'success',
    title: "Yesterday's report is ready",
    text: 'Revenue, money collected, expenses and profit for the full day.',
    time: 'Today',
    link: `/reports?date=${yesterday}`,
  });

  return items;
}

/* ---------------- Read state (kept on this device) ---------------- */

const STORE_KEY = 'optimas_read_notifications';
const listeners = new Set<() => void>();
let cache: Set<string> | null = null;

function load(): Set<string> {
  if (cache) return cache;
  try {
    cache = new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') as string[]);
  } catch {
    cache = new Set();
  }
  return cache;
}

function save(next: Set<string>) {
  // Keep the newest few hundred ids; old situations no longer appear anyway
  const list = [...next].slice(-300);
  cache = new Set(list);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: still works for this session
  }
  listeners.forEach((fn) => fn());
}

export function markNotificationsRead(ids: string[]) {
  const next = new Set(load());
  ids.forEach((id) => next.add(id));
  save(next);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORE_KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

/** The ids already read on this device; updates everywhere when one is read. */
export function useReadNotifications(): Set<string> {
  return useSyncExternalStore(subscribe, load, load);
}

/** Notifications plus how many are unread: used by the bell and the page. */
export function useNotifications() {
  const { canApprove } = useRole();
  const query = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
  const read = useReadNotifications();
  const items = useMemo(
    () => (query.data ? buildNotifications(query.data, { canApprove }) : []),
    [query.data, canApprove],
  );
  const unread = items.filter((n) => !read.has(n.id)).length;
  return { ...query, items, read, unread };
}
