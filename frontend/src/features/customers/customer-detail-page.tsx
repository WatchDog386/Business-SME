import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Plus,
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { customersApi, salesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { formatKES, formatDate, formatDateTime } from '@/lib/utils';
import { useState } from 'react';
import { CustomerForm } from './customer-form';

export function CustomerDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const customerQuery = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.get(id),
  });

  const salesQuery = useQuery({
    queryKey: ['customer-sales', id],
    queryFn: () => salesApi.list({ customerId: id, limit: 20 }),
  });

  if (customerQuery.isLoading) return <PageLoader />;

  if (customerQuery.error || !customerQuery.data) {
    return (
      <Alert variant="error" title="Customer not found">
        {apiErrorMessage(customerQuery.error)}
      </Alert>
    );
  }

  const customer = customerQuery.data;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-semibold text-foreground-5 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button onClick={() => navigate(`/sales/new?customer=${customer.id}`)}>
            <Plus className="h-4 w-4" />
            Record sale
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-xl font-extrabold text-accent-text">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">
                {customer.name}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-5">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {customer.email}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total spent" value={formatKES(customer.total_spent)} />
            <Stat
              label="Owes you"
              value={formatKES(customer.outstanding_balance)}
              tone={customer.outstanding_balance > 0 ? 'danger' : 'default'}
            />
            <Stat label="Visits" value={String(customer.visit_count)} />
            <Stat
              label="Last visit"
              value={customer.last_visit_at ? formatDate(customer.last_visit_at) : '—'}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Sales history</CardTitle>
          <Link
            to={`/sales?customer=${customer.id}`}
            className="text-sm font-semibold text-accent hover:text-accent-strong"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {salesQuery.isLoading && <PageLoader />}
          {salesQuery.data && salesQuery.data.items.length === 0 && (
            <EmptyState
              icon={ShoppingCart}
              title="No sales yet"
              description="This customer hasn't bought anything yet. Record their first sale."
              actionLabel="Record a sale"
              onAction={() => navigate(`/sales/new?customer=${customer.id}`)}
            />
          )}
          {salesQuery.data && salesQuery.data.items.length > 0 && (
            <ul className="divide-y divide-edge">
              {salesQuery.data.items.map((sale) => (
                <li key={sale.id}>
                  <Link
                    to={`/sales/${sale.id}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        #{sale.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-foreground-5">
                        {formatDateTime(sale.created_at)} · {sale.payment_method}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {formatKES(sale.total)}
                      </span>
                      <Badge variant={statusVariant(sale.payment_status)}>
                        {statusLabel(sale.payment_status)}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit customer"
        description="Update this customer's details."
      >
        <CustomerForm
          onClose={() => setEditOpen(false)}
          defaultValues={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            notes: customer.notes,
          }}
        />
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
}) {
  return (
      <div className="rounded-xl bg-surface-2 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-5">
        {label}
      </p>
      <p
        className={
          'mt-0.5 text-sm font-extrabold ' +
          (tone === 'danger' ? 'text-danger' : 'text-foreground')
        }
      >
        {value}
      </p>
    </div>
  );
}
