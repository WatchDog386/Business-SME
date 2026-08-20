import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi, businessesApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useBusinessStore } from '@/stores/business';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { PasswordInput } from './components/password-input';
import { AuthLayout, AuthFooterLink } from './components/auth-layout';

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Enter your full name.')
      .max(120, 'Name is too long.'),
    email: z.string().email('Enter a valid email address.'),
    phone: z
      .string()
      .regex(/^[0-9+\-\s]{9,15}$/, 'Enter a valid phone number like 0712 345 678.')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBusinesses = useBusinessStore((s) => s.setBusinesses);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authApi.register({
        email: values.email,
        fullName: values.fullName,
        phone: values.phone || undefined,
        password: values.password,
      }),
    onSuccess: async (result) => {
      setAuth(result.accessToken, result.user);
      try {
        const businesses = await businessesApi.mine();
        setBusinesses(businesses);
        navigate('/auth-success', {
          replace: true,
          state: { redirectTo: '/onboarding', subtitle: 'Account Created' },
        });
      } catch {
        navigate('/auth-success', {
          replace: true,
          state: { redirectTo: '/onboarding', subtitle: 'Account Created' },
        });
      }
      await queryClient.invalidateQueries();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start managing your business in minutes. No card needed."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        {error && <Alert variant="error">{error}</Alert>}
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="e.g. Mary Wanjiku"
            aria-invalid={errors.fullName ? true : undefined}
            className="h-12 px-5 text-base rounded-full"
            {...register('fullName')}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            className="h-12 px-5 text-base rounded-full"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            aria-invalid={errors.phone ? true : undefined}
            className="h-12 px-5 text-base rounded-full"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="8+ characters"
              aria-invalid={errors.password ? true : undefined}
              className="h-12 px-5 text-base rounded-full"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              className="h-12 px-5 text-base rounded-full"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
        <Button
          type="submit"
          className="w-full rounded-full"
          size="lg"
          loading={mutation.isPending}
        >
          Create account
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-ink-200" />
          </div>
          <div className="relative flex justify-center text-xs text-ink-500">
            Or continue with
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => (window.location.href = '/auth/oauth/google')}
            className="flex h-12 w-full items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-soft transition-colors hover:bg-ink-50"
            aria-label="Continue with Google"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.15 21.32 7.23 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.6H1.18C.43 8.12 0 9.82 0 12s.43 3.88 1.18 5.4l4.09-3.16z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.6l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = '/auth/oauth/facebook')}
            className="flex h-12 w-full items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-soft transition-colors hover:bg-ink-50"
            aria-label="Continue with Facebook"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = '/auth/oauth/twitter')}
            className="flex h-12 w-full items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-soft transition-colors hover:bg-ink-50"
            aria-label="Continue with Twitter"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#000000"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
          </button>
        </div>
      </form>
      <AuthFooterLink
        text="Already have an account?"
        linkText="Log in"
        to="/login"
      />
    </AuthLayout>
  );
}