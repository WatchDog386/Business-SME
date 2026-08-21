import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Camera, Store, CheckCircle2, ShieldCheck } from 'lucide-react';
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

const schema = z.object({
  name: z.string().min(2, 'Enter your business name.').max(150),
  businessType: z.string().min(1, 'Select a business category.'),
  customBusinessType: z.string().optional(),
  county: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  logoUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const categories = [
  { value: 'RETAIL', label: 'Retail Shop & General Store' },
  { value: 'SALON', label: 'Salon, Spa & Beauty' },
  { value: 'RESTAURANT', label: 'Restaurant, Cafe & Bar' },
  { value: 'ELECTRONICS', label: 'Electronics & Gadgets' },
  { value: 'HARDWARE', label: 'Hardware & Construction' },
  { value: 'WHOLESALE', label: 'Wholesale & Distribution' },
  { value: 'SERVICE', label: 'Professional Services' },
  { value: 'OTHER', label: 'Other Business Type' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setBusinesses = useBusinessStore((s) => s.setBusinesses);
  const selectBusiness = useBusinessStore((s) => s.selectBusiness);
  const token = useAuthStore((s) => s.token);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setValue('logoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      businessesApi.create({
        name: values.name,
        businessType: values.businessType === 'OTHER' && values.customBusinessType ? values.customBusinessType : values.businessType,
        county: values.county || undefined,
        address: values.address || undefined,
        logoUrl: values.logoUrl || undefined,
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
    <div className="min-h-screen bg-surface-2 px-4 py-10 sm:py-14">
      <PopupMessage
        isOpen={mutation.isPending}
        type="loading"
        title="Setting up your business..."
        message="Configuring your dashboard and tools."
      />
      <PopupMessage
        isOpen={Boolean(error)}
        type="error"
        title="Setup Error"
        message={error ?? undefined}
        onClose={() => setError(null)}
      />
      <div className="mx-auto w-full max-w-md space-y-7">
        {/* Centered Logo Upload */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-emerald-500/70 bg-white shadow-md transition-all hover:border-emerald-600 hover:shadow-lg active:scale-95"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Business Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-emerald-600">
                <Store className="h-7 w-7" strokeWidth={2} />
                <span className="text-[10px] font-semibold tracking-wide">Add Logo</span>
              </div>
            )}
            {logoPreview && (
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 shadow ring-2 ring-white">
                <Camera className="h-3.5 w-3.5 text-white" />
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Centered Header */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Set up your business</h1>
          <p className="text-xs sm:text-sm text-foreground-4">Enter your business files and details</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Elevated Setup Card — M3 style */}
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="rounded-[28px] bg-surface p-6 sm:p-8 shadow-[0_4px_24px_-6px_rgba(23,32,28,0.08),0_12px_40px_-12px_rgba(23,32,28,0.10)] ring-1 ring-black/[0.04] space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-foreground-4">
                Business name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Mama Njeri Enterprise"
                aria-invalid={errors.name ? true : undefined}
                className="h-13 rounded-2xl px-5 text-base bg-surface-2 border-transparent focus:border-emerald-600 focus:bg-surface hover:bg-zinc-50 transition-colors"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-xs font-bold uppercase tracking-wide text-foreground-4">
                Business category
              </Label>
              <Select
                id="businessType"
                placeholder="Select your business category"
                className="h-13 rounded-2xl px-5 text-base bg-surface-2 border-transparent focus:border-emerald-600 focus:bg-surface hover:bg-zinc-50 transition-colors w-full font-medium"
                {...register('businessType')}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
              {errors.businessType && (
                <p className="mt-1 text-xs text-danger">{errors.businessType.message}</p>
              )}
            </div>

            {selectedType === 'OTHER' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="customBusinessType" className="text-xs font-bold uppercase tracking-wide text-foreground-4">
                  Specify your business category
                </Label>
                <Input
                  id="customBusinessType"
                  placeholder="e.g. Agrovet & Farm Inputs"
                  className="h-13 rounded-2xl px-5 text-base bg-surface-2 border-transparent focus:border-emerald-600 focus:bg-surface hover:bg-zinc-50 transition-colors"
                  {...register('customBusinessType')}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="county" className="text-xs font-bold uppercase tracking-wide text-foreground-4">
                  County
                </Label>
                <Select
                  id="county"
                  placeholder="Select county"
                  className="h-13 rounded-2xl px-5 text-base bg-surface-2 border-transparent focus:border-emerald-600 focus:bg-surface hover:bg-zinc-50 transition-colors font-medium"
                  {...register('county')}
                >
                  {KENYAN_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wide text-foreground-4">
                  Location / address
                </Label>
                <Input
                  id="address"
                  placeholder="e.g. Umoja, Nairobi"
                  className="h-13 rounded-2xl px-5 text-base bg-surface-2 border-transparent focus:border-emerald-600 focus:bg-surface hover:bg-zinc-50 transition-colors"
                  {...register('address')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full bg-black text-white hover:bg-zinc-800 h-11 font-bold shadow-sm"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-bold shadow-md"
                loading={mutation.isPending}
              >
                Launch
              </Button>
            </div>
          </div>
        </form>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-5 pb-2 text-[11px] font-medium text-foreground-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Free forever plan
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Data secured &amp; private
          </span>
        </div>
      </div>
    </div>
  );
}
