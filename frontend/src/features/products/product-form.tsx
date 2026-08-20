import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';

const schema = z.object({
  name: z.string().min(2, 'Enter the product name.').max(150),
  sku: z.string().optional().or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
  costPrice: z.coerce
    .number({ invalid_type_error: 'Enter the cost price.' })
    .min(0, 'Cost price cannot be negative.'),
  sellingPrice: z.coerce
    .number({ invalid_type_error: 'Enter the selling price.' })
    .min(0, 'Selling price cannot be negative.'),
  stockQuantity: z.coerce
    .number({ invalid_type_error: 'Enter a stock quantity.' })
    .min(0, 'Stock cannot be negative.')
    .optional(),
  lowStockThreshold: z.coerce
    .number({ invalid_type_error: 'Enter a low stock level.' })
    .min(0)
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProductForm({
  onClose,
  defaultValues,
}: {
  onClose: () => void;
  defaultValues?: {
    id: string;
    name: string;
    sku: string | null;
    categoryId: string | null;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    track_inventory: boolean;
  };
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(defaultValues);

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'PRODUCT'],
    queryFn: () => categoriesApi.list('PRODUCT'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      sku: defaultValues?.sku ?? '',
      categoryId: defaultValues?.categoryId ?? '',
      costPrice: defaultValues?.cost_price ?? 0,
      sellingPrice: defaultValues?.selling_price ?? 0,
      stockQuantity: defaultValues?.stock_quantity ?? 0,
      lowStockThreshold: defaultValues?.low_stock_threshold ?? 5,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        sku: values.sku || undefined,
        categoryId: values.categoryId || undefined,
        costPrice: values.costPrice,
        sellingPrice: values.sellingPrice,
        lowStockThreshold: values.lowStockThreshold ?? 5,
        ...(isEdit ? {} : { stockQuantity: values.stockQuantity ?? 0 }),
      };
      return defaultValues
        ? productsApi.update(defaultValues.id, payload)
        : productsApi.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (err) =>
      setFormError('root', { message: apiErrorMessage(err) }),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      {errors.root && <Alert variant="error">{errors.root.message}</Alert>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="product-name">Product name</Label>
          <Input
            id="product-name"
            placeholder="e.g. Hair Relaxer 500ml"
            aria-invalid={errors.name ? true : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="product-sku">SKU / code</Label>
          <Input
            id="product-sku"
            placeholder="e.g. HR-500"
            {...register('sku')}
          />
        </div>
        <div>
          <Label htmlFor="product-category">Category</Label>
          <Select
            id="product-category"
            placeholder="No category"
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
          <Label htmlFor="product-cost">Cost price (KSh)</Label>
          <Input
            id="product-cost"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            aria-invalid={errors.costPrice ? true : undefined}
            {...register('costPrice')}
          />
          {errors.costPrice && (
            <p className="mt-1 text-xs text-danger">
              {errors.costPrice.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="product-sell">Selling price (KSh)</Label>
          <Input
            id="product-sell"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            aria-invalid={errors.sellingPrice ? true : undefined}
            {...register('sellingPrice')}
          />
          {errors.sellingPrice && (
            <p className="mt-1 text-xs text-danger">
              {errors.sellingPrice.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="product-stock">Opening stock</Label>
          <Input
            id="product-stock"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            disabled={isEdit}
            aria-invalid={errors.stockQuantity ? true : undefined}
            {...register('stockQuantity')}
          />
          {errors.stockQuantity && (
            <p className="mt-1 text-xs text-danger">
              {errors.stockQuantity.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="product-threshold">Low stock alert at</Label>
          <Input
            id="product-threshold"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="5"
            {...register('lowStockThreshold')}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {isEdit ? 'Save changes' : 'Add product'}
        </Button>
      </div>
    </form>
  );
}
