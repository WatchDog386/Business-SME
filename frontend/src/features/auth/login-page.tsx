import { useForm } from 'react-hook-form';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';
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
import { Lock, Mail } from 'lucide-react';
import { PasswordInput } from './components/password-input';
import { AuthLayout } from './components/auth-layout';
import { TwoFactorVerify } from './components/two-factor';
import type { AuthResult, MfaChallenge } from '@/api/types';

const schema = z.object({
  // Subscribers sign in with their username or account number; staff use their email
  identifier: z.string().trim().min(1, 'Enter your username or email.'),
  password: z.string().min(1, 'Enter your password.'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setBusinesses = useBusinessStore((s) => s.setBusinesses);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // Two-factor is optional: people who turned it on in Settings enter a code next
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  // From "Verify and continue" until the dashboard opens, one loader covers everything
  const [verifying, setVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  /** Runs once the second factor has passed: store the session and go in. */
  const finishSignIn = async (result: AuthResult) => {
    setSigningIn(true);
    setAuth(result.accessToken, result.user);
    // Invalidate first so dashboard bootstrap has fresh data, then go to loading/success
    await queryClient.invalidateQueries();
    try {
      const businesses = await businessesApi.mine();
      setBusinesses(businesses);
      const redirect = '/dashboard';
      navigate('/auth-success', {
        replace: true,
        state: { redirectTo: redirect, subtitle: 'Welcome back!' },
      });
    } catch {
      navigate('/auth-success', {
        replace: true,
        state: {
          redirectTo: '/dashboard',
          subtitle: 'Welcome back!',
        },
      });
    }
  };

  const restart = () => {
    setChallenge(null);
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authApi.login(values.identifier, values.password),
    onSuccess: (result) => {
      setError(null);
      if ('accessToken' in result) void finishSignIn(result);
      else setChallenge(result);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  // Strict flow: login -> loading/success -> dashboard. Don't jump to dashboard
  // ahead of success page — only redirect if already authenticated before this visit.
  if (token && !mutation.isPending && !mutation.isSuccess) return <Navigate to="/dashboard" replace />;

  if (challenge) {
    const title = 'Two-step verification';
    const subtitle = `Enter the code from your authenticator app for ${challenge.email}`;
    return (
      <AuthLayout
        title={title}
        desktopTitle={title}
        mobileTitle={title}
        subtitle={subtitle}
        desktopSubtitle={subtitle}
        hideLabelsOnMobile
        hideMobileFooter
      >
        <TwoFactorVerify
          mfaToken={challenge.mfaToken}
          onSignedIn={(result) => void finishSignIn(result)}
          onRestart={restart}
          onVerifying={setVerifying}
        />
        {(verifying || signingIn) && <WorkspaceLoader />}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back!"
      mobileTitle="Welcome back!"
      hideLabelsOnMobile
      hideMobileFooter
      hideFooterLinks
      forceMobileLayout
      centerTitle
      subtitle="Sign in with your Optimas staff account."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
        {error && <Alert variant="error">{error}</Alert>}
        <div>
          <Label htmlFor="email">Username or email</Label>
          <div className="relative">
            <Input
              id="email"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Username or email"
              aria-invalid={errors.identifier ? true : undefined}
              className="h-12 pl-12 pr-5 text-sm rounded-full"
              {...register('identifier')}
            />
            <Mail className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          </div>
          {errors.identifier && (
            <p className="mt-1 text-xs font-medium text-danger">{errors.identifier.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Password"
              aria-invalid={errors.password ? true : undefined}
              className="h-12 pl-12 pr-12 text-sm rounded-full"
              {...register('password')}
            />
            <Lock className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs font-medium text-danger">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="auth-link text-sm font-medium text-[#2F7F81] hover:text-[#256A6C]"
          >
            Forgot password?
          </button>
        </div>
        <Button
          type="submit"
          className="h-14 w-full rounded-2xl max-lg:fixed max-lg:inset-x-6 max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))] max-lg:z-10 max-lg:mx-auto max-lg:w-auto max-lg:max-w-sm text-[20px] font-medium text-white shadow-none transition-colors bg-[#3A8F91] hover:bg-[#2F7F81] active:bg-[#2F7F81]"
          size="lg"
          loading={mutation.isPending}
        >
          Sign in
        </Button>
        {signingIn && <WorkspaceLoader />}

      </form>
    </AuthLayout>
  );
}

