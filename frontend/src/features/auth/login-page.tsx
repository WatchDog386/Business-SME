import { useForm } from 'react-hook-form';
import { WorkspaceLoader } from '@/components/ui/workspace-loader';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi, businessesApi } from '@/api/endpoints';
import { ApiErrorShape, apiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useBusinessStore } from '@/stores/business';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InvalidDetailsArt } from '@/components/brand/invalid-details-art';
import { notifyError } from '@/components/ui/popup-host';
import { Download, Lock, Mail } from 'lucide-react';
import { PasswordInput } from './components/password-input';
import { AuthLayout } from './components/auth-layout';
import { TwoFactorVerify } from './components/two-factor';
import { Brand } from '@/components/layout/brand';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { usePhotoStatusBar } from '@/hooks/use-photo-status-bar';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { useTheme } from '@/lib/theme';
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
  // Two-factor is optional: people who turned it on in Settings enter a code next
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  // From "Verify and continue" until the dashboard opens, one loader covers everything
  const [verifying, setVerifying] = useState(false);
  const isDesktop = useIsDesktop();
  const [theme] = useTheme();
  const { canInstall, install } = useInstallPrompt();

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
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      authApi.login(values.identifier, values.password),
    onSuccess: (result) => {
      if ('accessToken' in result) void finishSignIn(result);
      else setChallenge(result);
    },
    // Raised the moment they press Sign in, not while they are still typing:
    // the picture only comes out when the details themselves were wrong
    onError: (err) => {
      if (err instanceof ApiErrorShape && err.code === 'INVALID_CREDENTIALS') {
        notifyError('Invalid Details', apiErrorMessage(err), {
          illustration: <InvalidDetailsArt />,
          actionLabel: 'Okay',
          duration: null,
        });
        return;
      }
      notifyError('Could not sign in', apiErrorMessage(err));
    },
  });

  // Phone sign-in shows the photo right up behind the status bar (same as the home page)
  usePhotoStatusBar(!isDesktop && !challenge);

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

  const form = (
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        noValidate
      >
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
            <Mail className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" aria-hidden />
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
            <Lock className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" aria-hidden />
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
          className="h-14 w-full rounded-2xl text-[20px] font-medium text-white shadow-none transition-colors bg-[#3A8F91] hover:bg-[#2F7F81] active:bg-[#2F7F81]"
          size="lg"
          loading={mutation.isPending}
        >
          Sign in
        </Button>
        {signingIn && <WorkspaceLoader />}

      </form>
  );

  const installAppButton = canInstall ? (
    <button
      type="button"
      onClick={() => void install()}
      className={
        'mx-auto mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium shadow-sm ' +
        (!isDesktop && theme === 'dark'
          ? 'border-white/45 bg-black/20 text-white'
          : 'border-[#3A8F91]/45 bg-white/75 text-slate-700')
      }
    >
      <Download className="h-4 w-4" aria-hidden />
      Install Optimas app
    </button>
  ) : null;

  // Phones: photo header with the logo, and a sheet holding the form. The sheet
  // follows the chosen theme and its fields match the Statement / Deposit pills
  // on the subscriber dashboard.
  if (!isDesktop) {
    const dark = theme === 'dark';
    return (
      <div className="relative flex min-h-[100dvh] flex-col bg-white">
        {/* Photo covers the whole screen, from under the status bar down behind the sheet */}
        <img src="/images/splash-savanna.jpg" alt="" aria-hidden className="fixed inset-0 h-full w-full object-cover" />
        <div className="relative flex min-h-[200px] w-full flex-1 items-center justify-center pb-10 pt-[env(safe-area-inset-top)] [&_img]:drop-shadow-[0_2px_6px_rgba(255,255,255,0.35)]">
          <Brand size="xl" onDark />
        </div>
        <main
          className={
            'relative flex shrink-0 flex-col rounded-t-3xl px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 ' +
            (dark
              ? 'border-t border-white/15 bg-black/55 text-white shadow-[0_-10px_24px_rgba(0,0,0,0.45)] backdrop-blur-md'
              : 'bg-white/80 text-slate-900 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md')
          }
        >
          <div className={dark ? 'mx-auto h-1 w-12 rounded-full bg-white/40' : 'mx-auto h-1 w-12 rounded-full bg-slate-400'} aria-hidden />
          <h1 className={dark ? 'mt-5 text-center text-[22px] font-semibold tracking-tight text-white' : 'mt-5 text-center text-[22px] font-semibold tracking-tight text-slate-900'}>
            Welcome back!
          </h1>
          <p className={dark ? 'mb-6 mt-1 text-center text-sm text-white/70' : 'mb-6 mt-1 text-center text-sm text-slate-700'}>
            Sign in with your Optimas staff account.
          </p>
          {dark ? (
            /* Outlined pills, as on the subscriber dashboard's Statement and Deposit buttons */
            <div className="mt-6 [&_input]:!h-12 [&_input]:!rounded-xl [&_input]:!border-2 [&_input]:!border-white/70 [&_input]:!bg-transparent [&_input]:!text-white [&_input]:!shadow-none [&_input]:placeholder:text-white/60 [&_button]:!text-white/70 [&_.auth-link]:!text-[#7BCFD2] [&_.text-danger]:!text-red-300 [&_label]:sr-only">
              {form}
            </div>
          ) : (
            /* Muted, borderless fields as in the original sign-in page */
            <div className="mt-6 [&_input]:!rounded-xl [&_input]:!border-white/15 [&_input]:!bg-[#1E1E1E] [&_input]:!text-white [&_input]:!shadow-none [&_input]:placeholder:!text-white/60 [&_button]:!text-white/70 [&_.auth-link]:!text-[#2F7F81] [&_label]:sr-only">
              {form}
            </div>
          )}
          {installAppButton}
        </main>
      </div>
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
      <>
        {form}
        {installAppButton}
      </>
    </AuthLayout>
  );
}

