import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  ShieldCheck,
  Check,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { businessesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { useBusinessStore } from '@/stores/business';
import { useAuthStore } from '@/stores/auth';
import { startCheckout } from '@/lib/paystack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { PopupMessage } from '@/components/ui/popup-message';
import { cn } from '@/lib/utils';
import { KENYAN_COUNTIES } from '@/lib/constants';

const schema = z.object({
  name: z.string().min(2, 'Enter your business name.').max(150),
  businessType: z.string().min(1, 'Select a business category.'),
  customBusinessType: z.string().optional(),
  county: z.string().optional().or(z.literal('')),
  address: z.string().optional(),
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

// Placeholder packages — swap pricing & features later
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'KSh 0',
    amount: 0,
    period: '/month',
    tagline: 'Everything you need to get going',
    features: ['Unlimited sales recording', 'Basic inventory tracking', 'Email support'],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 'KSh 999',
    amount: 999,
    period: '/month',
    tagline: 'For businesses on the rise',
    features: ['Everything in Starter', 'Advanced reports & analytics', 'Multi-user access', 'Priority support'],
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 'KSh 2,499',
    amount: 2499,
    period: '/month',
    tagline: 'Power tools for serious volume',
    features: ['Everything in Growth', 'Multi-branch management', 'Custom integrations', 'Dedicated manager'],
    popular: false,
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setBusinesses = useBusinessStore((s) => s.setBusinesses);
  const selectBusiness = useBusinessStore((s) => s.selectBusiness);
  const token = useAuthStore((s) => s.token);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<string>('growth');
  const [paying, setPaying] = useState(false);
  const [paidReference, setPaidReference] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { businessType: '' },
  });

  const selectedType = watch('businessType');
  const businessName = watch('name');

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

  const goToPlans = async () => {
    const valid = await trigger(['name', 'businessType']);
    if (valid) setStep(2);
  };

  const plan = plans.find((p) => p.id === selectedPlan) ?? plans[1];
  const email = useAuthStore((s) => s.user?.email ?? '');

  const handlePay = async () => {
    setError(null);
    setPaying(true);
    try {
      const result = await startCheckout({
        email,
        planId: plan.id,
        planName: plan.name,
        amountKes: plan.amount,
      });
      setPaidReference(result.reference);
    } catch {
      setError('Payment did not go through. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-surface-2 px-4 py-8 sm:py-12">
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
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-foreground-4">
            <span>Step {step} of 3</span>
            <span>
              {step === 1 ? 'Business details' : step === 2 ? 'Choose a plan' : 'Checkout'}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-300',
                  s <= step ? 'bg-accent' : 'bg-edge',
                )}
              />
            ))}
          </div>
        </div>

        {/* Identity */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-accent/60 bg-surface shadow-soft transition-all hover:border-accent hover:shadow-lift active:scale-95"
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Business logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-accent">
                <Camera className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] font-medium tracking-wide">Logo</span>
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <div className="min-w-0 leading-tight">
            <h1 className="text-lg font-medium tracking-tight text-foreground">
              {step === 1 ? 'Set up your business' : step === 2 ? 'Pick your plan' : 'Checkout'}
            </h1>
            <p className="truncate text-[13px] text-foreground-3">
              {step === 1
                ? 'Tell us about your business'
                : step === 2
                  ? businessName
                    ? `${businessName} · monthly billing`
                    : 'Monthly packages, cancel anytime'
                  : `Paying for ${plan.name} · monthly`}
            </p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* ---------- STEP 1 · DETAILS ---------- */}
        {step === 1 && (
          <form
            onSubmit={handleSubmit(() => void goToPlans())}
            noValidate
            className="animate-fade-up space-y-6"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                placeholder="e.g. Mama Njeri Enterprise"
                aria-invalid={errors.name ? true : undefined}
                className="h-12 px-5 text-sm rounded-full"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="businessType">Business category</Label>
              <Select
                id="businessType"
                placeholder="Select your business category"
                className="h-12 w-full rounded-full px-5 text-sm"
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
              <div className="animate-fade-in space-y-1.5">
                <Label htmlFor="customBusinessType">Specify your business category</Label>
                <Input
                  id="customBusinessType"
                  placeholder="e.g. Agrovet & Farm Inputs"
                  className="h-12 px-5 text-sm rounded-full"
                  {...register('customBusinessType')}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="county">County</Label>
                <Select
                  id="county"
                  placeholder="Select county"
                  className="h-12 w-full rounded-full px-5 text-sm"
                  {...register('county')}
                >
                  {KENYAN_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Location / address</Label>
                <Input
                  id="address"
                  placeholder="e.g. Umoja, Nairobi"
                  className="h-12 px-5 text-sm rounded-full"
                  {...register('address')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="rounded-full bg-brand-700 text-white hover:bg-brand-800"
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* ---------- STEP 2 · PLAN ---------- */}
        {step === 2 && (
          <div className="animate-fade-up space-y-4">
            <div className="space-y-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      'relative flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.99]',
                      isSelected
                        ? 'border-accent bg-accent-soft shadow-lift ring-1 ring-accent'
                        : 'border-edge bg-surface shadow-soft hover:border-edge-2',
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        Most popular
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-base font-semibold text-foreground">
                          {plan.name}
                          {isSelected && (
                            <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-accent" aria-hidden />
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-foreground-3">{plan.tagline}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-semibold leading-none tracking-tight text-foreground tabular-nums">
                          {plan.price}
                        </p>
                        <p className="mt-1 text-[11px] text-foreground-4">{plan.period}</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-xs text-foreground-2">
                          <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-foreground-4">
              All plans are billed monthly · cancel or switch anytime
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-full"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="rounded-full bg-brand-700 text-white hover:bg-brand-800"
              >
                Continue to checkout
              </Button>
            </div>
          </div>
        )}

        {/* ---------- STEP 3 · CHECKOUT ---------- */}
        {step === 3 && (
          <div className="animate-fade-up space-y-5">
            {/* Order summary */}
            <div className="space-y-3 rounded-2xl border border-edge bg-surface p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-4">
                  Order summary
                </p>
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Monthly
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{plan.name} plan</span>
                <span className="tabular-nums text-foreground-2">{plan.price}{plan.period}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-3">Business</span>
                <span className="max-w-[60%] truncate font-medium text-foreground">
                  {businessName || 'My business'}
                </span>
              </div>
              <div className="border-t border-edge pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-foreground">Total due today</span>
                  <span className="text-xl font-semibold tracking-tight tabular-nums text-foreground">
                    {plan.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <div className="flex items-center justify-between rounded-full border border-accent bg-accent-soft px-5 py-3">
                <span className="text-sm font-medium text-accent-strong">Card · Paystack</span>
                <CheckCircle2 className="h-4.5 w-4.5 text-accent" aria-hidden />
              </div>
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-between rounded-full border border-edge bg-surface px-5 py-3 opacity-50"
              >
                <span className="text-sm text-foreground-3">M-Pesa (coming soon)</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-5">
                  Soon
                </span>
              </button>
            </div>

            {paidReference && (
              <div className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-xs font-medium text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Payment confirmed · Ref {paidReference}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={paying}
                className="rounded-full"
              >
                Back
              </Button>
              {paidReference ? (
                <Button
                  onClick={handleSubmit((values) => mutation.mutate(values))}
                  loading={mutation.isPending}
                  className="rounded-full bg-brand-700 text-white hover:bg-brand-800"
                >
                  <Rocket className="h-4 w-4" aria-hidden />
                  Launch
                </Button>
              ) : (
                <Button onClick={handlePay} loading={paying} className="rounded-full bg-brand-700 text-white hover:bg-brand-800">
                  Pay {plan.price}
                </Button>
              )}
            </div>

            {!paidReference && (
              <p className="text-center text-[11px] text-foreground-4">
                Secured by Paystack · you can cancel anytime
              </p>
            )}
          </div>
        )}

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-5 pb-2 text-[10px] font-medium text-foreground-4">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            Free forever plan
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Data secured &amp; private
          </span>
        </div>
      </div>
    </div>
  );
}
