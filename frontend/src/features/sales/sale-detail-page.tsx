import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Receipt,
  Plus,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { salesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, statusVariant, statusLabel } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageLoader } from '@/components/ui/spinner';
import { formatKES, formatDateTime } from '@/lib/utils';
import { DEFAULT_PAYMENT_METHODS } from '@/lib/constants';

const paymentSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Enter an amount.' })
    .min(1, 'Enter a valid amount.'),
  method: z.string().min(1, 'Select a payment method.'),
  reference: z.string().optional().or(z.literal('')),
});

type PaymentValues = z.infer<typeof paymentSchema>;

export function SaleDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales', id],
    queryFn: () => salesApi.get(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => salesApi.cancel(id),
    onSuccess: async () => {
      setCancelOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => setCancelError(apiErrorMessage(err)),
  });

  if (isLoading) return <PageLoader />;

  if (error || !data) {
    return (
      <Alert variant="error" title="Sale not found">
        {apiErrorMessage(error)}
      </Alert>
    );
  }

  const sale = data;
  const paid = sale.payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, sale.total - paid);
  const canCancel = sale.payment_status !== 'CANCELLED' && sale.payment_status !== 'REFUNDED';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium text-foreground-5 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex gap-2">
          {canCancel && (
            <Button
              variant="outline"
              className="text-danger hover:bg-danger-soft"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancel sale
            </Button>
          )}
          {remaining > 0 && sale.payment_status !== 'CANCELLED' && (
            <Button onClick={() => setPaymentOpen(true)}>
              <Plus className="h-4 w-4" />
              Record payment
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-accent" aria-hidden />
              <h1 className="text-base font-medium text-foreground">
                #{sale.id.slice(0, 8).toUpperCase()}
              </h1>
              <Badge variant={statusVariant(sale.payment_status)}>
                {statusLabel(sale.payment_status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-foreground-5">
              {formatDateTime(sale.created_at)} ·{' '}
              {sale.customer?.name ?? 'Walk-in customer'}
            </p>
          </div>
          <div className="rounded-xl bg-accent-soft px-4 py-2">
            <p className="text-xs font-medium uppercase text-accent">
              Total
            </p>
            <p className="text-xl font-medium text-foreground">
              {formatKES(sale.total)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-edge">
              {sale.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.product_name ?? item.service_name ?? item.item_name}
                    </p>
                    <p className="text-xs text-foreground-5">
                      {item.quantity} × {formatKES(item.unit_price)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {formatKES(item.total)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-edge pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-5">Subtotal</span>
                <span className="font-medium">{formatKES(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-5">Discount</span>
                  <span className="font-medium text-danger">
                    −{formatKES(sale.discount)}
                  </span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground-5">Tax</span>
                  <span className="font-medium">{formatKES(sale.tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total</span>
                <span className="font-medium">{formatKES(sale.total)}</span>
              </div>
            </div>
            {sale.notes && (
              <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-foreground-5">
                {sale.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {sale.payments.length === 0 ? (
                <p className="text-sm text-foreground-5">No payments recorded yet.</p>
              ) : (
                <ul className="divide-y divide-edge">
                  {sale.payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {payment.method}
                          {payment.reference && (
                            <span className="text-xs text-foreground-5">
                              {' '}· {payment.reference}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-foreground-5">
                          {formatDateTime(payment.transaction_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {formatKES(payment.amount)}
                        </p>
                        <Badge variant={statusVariant(payment.status)}>
                          {statusLabel(payment.status)}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 space-y-1 border-t border-edge pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-5">Paid</span>
                  <span className="font-medium text-success">
                    {formatKES(paid)}
                  </span>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between">
                    <span className="text-foreground-5">Remaining</span>
                    <span className="font-medium text-danger">
                      {formatKES(remaining)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {sale.customer && (
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{sale.customer.name}</p>
                    <p className="text-xs text-foreground-5">
                      {sale.customer.phone ?? 'No phone'} · owes{' '}
                      {formatKES(sale.customer.outstanding_balance)}
                    </p>
                  </div>
                  <Link
                    to={`/customers/${sale.customer.id}`}
                    className="text-sm font-medium text-accent hover:text-accent"
                  >
                    View profile
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <RecordPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        saleId={sale.id}
        remaining={remaining}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this sale?"
        description="Cancelling reverses the sale: stock is returned, customer balances are corrected, and all payments are refunded. This cannot be undone."
        confirmLabel="Cancel sale"
        destructive
        loading={cancelMutation.isPending}
        error={cancelError}
        onConfirm={() => cancelMutation.mutate()}
      />
    </div>
  );
}

function RecordPaymentDialog({
  open,
  onOpenChange,
  saleId,
  remaining,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  remaining: number;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    reset,
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: remaining, method: 'CASH', reference: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: PaymentValues) =>
      salesApi.recordPayment(saleId, {
        amount: values.amount,
        method: values.method,
        reference: values.reference || undefined,
      }),
    onSuccess: async () => {
      onOpenChange(false);
      reset();
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => setFormError('root', { message: apiErrorMessage(err) }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Record a payment"
      description={`${formatKES(remaining)} remaining on this sale.`}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
        <div>
          <Label htmlFor="payment-amount">Amount (KSh)</Label>
          <Input
            id="payment-amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={remaining}
            aria-invalid={errors.amount ? true : undefined}
            {...register('amount')}
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="payment-method">Payment method</Label>
          <Select
            id="payment-method"
            aria-invalid={errors.method ? true : undefined}
            {...register('method')}
          >
            {DEFAULT_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === 'M-PESA'
                  ? 'M-Pesa'
                  : method.charAt(0) + method.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
          {errors.method && (
            <p className="mt-1 text-xs text-danger">{errors.method.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="payment-reference">Reference (optional)</Label>
          <Input
            id="payment-reference"
            placeholder="e.g. M-Pesa receipt code"
            {...register('reference')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            <CheckCircle2 className="h-4 w-4" />
            Record payment
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
