import {
  BadgePercent,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  Landmark,
  PackageX,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardData } from '@/api/types';

export type NotificationCategory = 'promotions' | 'stock' | 'sales';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  icon: LucideIcon;
  tone: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  text: string;
  time: string;
  link: string;
}

// Toggle to false to preview the empty state
export const SHOW_NOTIFICATIONS = false;

export function buildNotifications(data: DashboardData): NotificationItem[] {
  const items: NotificationItem[] = [];

  // Promotions
  items.push(
    {
      id: 'promo-loans',
      category: 'promotions',
      icon: Landmark,
      tone: 'success',
      title: 'Unlock Business Loans Instantly',
      text: 'Access working capital of up to KSh 500,000 based on your verified sales history.',
      time: '1h ago',
      link: '/dashboard',
    },
    {
      id: 'promo-tax',
      category: 'promotions',
      icon: FileCheck2,
      tone: 'info',
      title: 'Zero-Paper Tax & Compliance',
      text: 'Generate KRA-ready sales and profit reports in one tap. Stay audit-ready effortlessly.',
      time: 'Yesterday',
      link: '/reports',
    },
    {
      id: 'promo-growth',
      category: 'promotions',
      icon: BadgePercent,
      tone: 'warning',
      title: 'Grow Your Business with M-Pesa',
      text: 'Instant reconciliation, automated stock tracking and zero paperwork for your business.',
      time: '2 days ago',
      link: '/dashboard',
    },
    {
      id: 'platform-active',
      category: 'promotions',
      icon: CheckCircle2,
      tone: 'success',
      title: 'Platform Active',
      text: 'Your Biashara platform is fully synchronized and running smoothly.',
      time: 'System',
      link: '/dashboard',
    },
  );

  // Stock
  if (data.lowStock > 0) {
    items.push({
      id: 'low-stock',
      category: 'stock',
      icon: PackageX,
      tone: 'warning',
      title: 'Low Stock Alert',
      text: `${data.lowStock} product${data.lowStock === 1 ? ' is' : 's are'} running low on stock. Restock soon to avoid losing sales.`,
      time: 'Today',
      link: '/products',
    });
  }

  // Sales
  const debtors = data.recentCustomers.filter((c) => c.outstanding_balance > 0);
  if (debtors.length > 0) {
    const total = debtors.reduce((acc, c) => acc + c.outstanding_balance, 0);
    items.push({
      id: 'debtors',
      category: 'sales',
      icon: Wallet,
      tone: 'danger',
      title: 'Outstanding Customer Credit',
      text: `${debtors.length} customer${debtors.length === 1 ? '' : 's'} owe a total of KSh ${total.toLocaleString('en-KE')}.`,
      time: 'Today',
      link: '/customers',
    });
  }

  if (data.appointmentsToday > 0) {
    items.push({
      id: 'appointments',
      category: 'sales',
      icon: CalendarClock,
      tone: 'info',
      title: 'Appointments Today',
      text: `${data.appointmentsToday} service appointment${data.appointmentsToday === 1 ? '' : 's'} scheduled for today.`,
      time: 'Today',
      link: '/services',
    });
  }

  return SHOW_NOTIFICATIONS ? items : [];
}
