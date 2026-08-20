import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, expensesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { EXPENSE_PAYMENT_METHODS } from '@/lib/constants';

const schema = z.object({
  description: z.string().min(2, 'Describe this expense.').max(150),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter the amount.' })
    .min(1, 'Enter a valid amount.'),
  categoryId: z.string().optional().or(z.literal('')),
  paymentMethod: z.string().optional(),
  expenseDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ExpenseForm({
  onClose,
  defaultValues,
}: {
  onClose: () => void;
  defaultValues?: {
    id: string;
    description: string;
    amount: number;
    categoryId: string | null;
    payment_method: string;
    expense_date: string;
  };
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(defaultValues);

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'EXPENSE'],
    queryFn: () => categoriesApi.list('EXPENSE'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: defaultValues?.description ?? '',
      amount: defaultValues?.amount ?? 0,
      categoryId: defaultValues?.categoryId ?? '',
      paymentMethod: defaultValues?.payment_method ?? 'CASH',
      expenseDate: defaultValues?.expense_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        description: values.description,
        amount: values.amount,
        categoryId: values.categoryId || undefined,
        paymentMethod: values.paymentMethod || 'CASH',
        expenseDate: values.expenseDate || new Date().toISOString(),
      };
      return defaultValues
        ? expensesApi.update(defaultValues.id, payload)
        : expensesApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
    },
    onError: (err) => setFormError('root', { message: apiErrorMessage(err) }),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
      <div>
        <Label htmlFor="expense-description">Description</Label>
        <Input
          id="expense-description"
          placeholder="e.g. Shop rent"
          aria-invalid={errors.description ? true : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-danger">
            {errors.description.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="expense-amount">Amount (KSh)</Label>
          <Input
            id="expense-amount"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="0"
            aria-invalid={errors.amount ? true : undefined}
            {...register('amount')}
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            aria-invalid={errors.expenseDate ? true : undefined}
            {...register('expenseDate')}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="expense-category">Category</Label>
          <Select
            id="expense-category"
            placeholder="Uncategorized"
            {...register('categoryId')}
          >
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="expense-method">Payment method</Label>
          <Select
            id="expense-method"
            {...register('paymentMethod')}
          >
            {EXPENSE_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method === 'M-PESA'
                  ? 'M-Pesa'
                  : method.charAt(0) + method.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  );
}
