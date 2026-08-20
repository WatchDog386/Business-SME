import { Link } from 'react-router-dom';
import { PackageX, Wallet, CalendarClock } from 'lucide-react';
import type { DashboardData } from '@/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Alerts({ data }: { data: DashboardData }) {
  const alerts: Array<{
    icon: typeof PackageX;
    text: string;
    tone: 'warning' | 'danger' | 'info';
    link: string;
  }> = [];

  if (data.lowStock > 0) {
    alerts.push({
      icon: PackageX,
      text: `${data.lowStock} product${data.lowStock === 1 ? ' is' : 's are'} running low on stock.`,
      tone: 'warning',
      link: '/products',
    });
  }

  const debtors = data.recentCustomers.filter((c) => c.outstanding_balance > 0);
  if (debtors.length > 0) {
    const total = debtors.reduce((acc, c) => acc + c.outstanding_balance, 0);
    alerts.push({
      icon: Wallet,
      text: `${debtors.length} customer${debtors.length === 1 ? ' has' : 's have'} outstanding balances totalling ${formatKes(total)}.`,
      tone: 'danger',
      link: '/customers',
    });
  }

  if (data.appointmentsToday > 0) {
    alerts.push({
      icon: CalendarClock,
      text: `${data.appointmentsToday} appointment${data.appointmentsToday === 1 ? ' is' : 's are'} scheduled today.`,
      tone: 'info',
      link: '/reports',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Things to check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => (
          <Link
            key={alert.text}
            to={alert.link}
            className="flex items-center justify-between gap-3 rounded-full border border-edge px-4 py-3 transition-colors hover:border-edge hover:bg-surface-2"
          >
            <div className="flex items-center gap-3">
              <alert.icon className="h-5 w-5 text-warning" aria-hidden />
              <p className="text-sm font-medium text-foreground-2">{alert.text}</p>
            </div>
            <Badge variant={alert.tone === 'danger' ? 'danger' : 'warning'}>
              View
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function formatKes(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}