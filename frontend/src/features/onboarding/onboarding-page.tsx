import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Scissors,
  Store,
  Utensils,
  Car,
  Wrench,
  Smartphone,
  Package,
  Sparkles,
  Building2,
  X,
} from 'lucide-react';
import { businessesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { useBusinessStore } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { PopupMessage } from '@/components/ui/popup-message';
import { KENYAN_COUNTIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const businessTypeIcons: Record<string, typeof Store> = {
  SALON: Scissors,
  BARBERSHOP: Scissors,
  BEAUTY: Sparkles,
  RETAIL: Store,
  BOUTIQUE: Store,
  RESTAURANT: Utensils,
  CAR_WASH: Car,
  HARDWARE: Wrench,
  ELECTRONICS: Smartphone,
  WHOLESALE: Package,
  MECHANIC: Wrench,
  FUNDI: Wrench,
  SERVICE: Building2,
  OTHER: Building2,
};

const schema = z.object({
  name: z.string().min(2, 'Enter your business name.').max(150),
  businessType: z.string().min(1, 'Select a business type.'),
  customBusinessType: z.string().optional(),
  phone: z.string().optional().or(z.literal('')),
  county: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const options = [
  { value: 'RETAIL', label: 'Retail Shop', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md', iconClass: 'bg-emerald-100 text-emerald-600' },
  { value: 'SALON', label: 'Salon & Spa', activeClass: 'bg-pink-600 text-white border-pink-600 shadow-md', iconClass: 'bg-pink-100 text-pink-600' },
  { value: 'RESTAURANT', label: 'Restaurant', activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md', iconClass: 'bg-amber-100 text-amber-600' },
  { value: 'ELECTRONICS', label: 'Electronics', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md', iconClass: 'bg-blue-100 text-blue-600' },
  { value: 'HARDWARE', label: 'Hardware', activeClass: 'bg-purple-600 text-white border-purple-600 shadow-md', iconClass: 'bg-purple-100 text-purple-600' },
  { value: 'WHOLESALE', label: 'Wholesale', activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-md', iconClass: 'bg-indigo-100 text-indigo-600' },
  { value: 'SERVICE', label: 'Service', activeClass: 'bg-teal-600 text-white border-teal-600 shadow-md', iconClass: 'bg-teal-100 text-teal-600' },
  { value: 'OTHER', label: 'Other', activeClass: 'bg-zinc-800 text-white border-zinc-800 shadow-md', iconClass: 'bg-zinc-200 text-zinc-700' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setBusinesses = useBusinessStore((s) => s.setBusinesses);
  const selectBusiness = useBusinessStore((s) => s.selectBusiness);
  const token = useAuthStore((s) => s.token);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: '' },
  });

  const selectedType = watch('businessType');

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      businessesApi.create({
        name: values.name,
        businessType: values.businessType === 'OTHER' && values.customBusinessType ? values.customBusinessType : values.businessType,
        phone: values.phone || undefined,
        county: values.county || undefined,
        address: values.address || undefined,
        currency: 'KES',
        timezone: 'Africa/Nairobi',
      }),
    onSuccess: async (business) => {
      selectBusiness(business);
      const mine = await businessesApi.mine();
      setBusinesses(mine);
      await queryClient.invalidateQueries();
      navigate('/dashboard', { replace: true });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-surface px-4 py-8 sm:py-12">
      <PopupMessage
        isOpen={mutation.isPending}
        type="loading"
        title="Setting up your business..."
        message="Configuring Sawasync dashboard and tools."
      />
      <PopupMessage
        isOpen={Boolean(error)}
        type="error"
        title="Setup Error"
        message={error ?? undefined}
        onClose={() => setError(null)}
      />
      <div className="mx-auto max-w-xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Sawasync</h1>
            <p className="mt-1 text-xs text-foreground-4">Professional SME Business Suite</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-surface-3 border border-edge"
          >
            <X className="h-4 w-4" />
            <span>Exit</span>
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">Set up your business</h2>
          <p className="mt-1 text-sm text-foreground-4">
            Personalize your account to start managing sales and analytics.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form
          className="space-y-6"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              placeholder="e.g. Mama Njeri Enterprise"
              aria-invalid={errors.name ? true : undefined}
              className="h-12 rounded-2xl px-4 text-base"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <span className="block text-sm font-semibold text-foreground">
              What kind of business is this?
            </span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {options.map((option) => {
                const IconComponent = businessTypeIcons[option.value] || Building2;
                const isSelected = selectedType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('businessType', option.value, { shouldValidate: true })}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all duration-150',
                      isSelected
                        ? option.activeClass + ' ring-2 ring-offset-2 ring-accent'
                        : 'border-edge bg-surface text-foreground-2 hover:border-accent-border hover:bg-surface-2',
                    )}
                  >
                    <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', isSelected ? 'bg-white/20 text-white' : option.iconClass)}>
                      <IconComponent className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold leading-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.businessType && (
              <p className="mt-1 text-xs text-danger">
                {errors.businessType.message}
              </p>
            )}
          </div>

          {selectedType === 'OTHER' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="customBusinessType">Specify your business type</Label>
              <Input
                id="customBusinessType"
                placeholder="e.g. Agrovet & Farm Inputs"
                className="h-12 rounded-2xl px-4 text-base"
                {...register('customBusinessType')}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0712 345 678"
                className="h-12 rounded-2xl px-4 text-base"
                {...register('phone')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="county">County</Label>
              <Select
                id="county"
                placeholder="Select your county"
                className="h-12 rounded-2xl px-4 text-base"
                {...register('county')}
              >
                {KENYAN_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Location / address (optional)</Label>
            <Input
              id="address"
              placeholder="e.g. Umoja Innercore, Nairobi"
              className="h-12 rounded-2xl px-4 text-base"
              {...register('address')}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-5 py-4 text-xs font-semibold text-foreground-3 border border-edge">
            <span>Currency: <strong className="text-foreground">Kenyan Shilling (KES)</strong></span>
            <span>Timezone: <strong className="text-foreground">Africa/Nairobi</strong></span>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full h-12 text-base font-bold shadow-md"
            loading={mutation.isPending}
          >
            Complete Setup & Launch
          </Button>
        </form>
      </div>
    </div>
  );
}
