import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, LogOut, Moon, Save, Sun } from 'lucide-react';
import { authApi, clientApi } from '@/api/endpoints';
import { apiErrorMessage } from '@/api/client';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';
import { requestLogout } from '@/components/layout/session-timeout';
import { notifySuccess } from '@/components/ui/popup-host';
import { cn } from '@/lib/utils';

const detailsSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name.'),
  phone: z.string().trim().max(20, 'That number looks too long.'),
});

type DetailsValues = z.infer<typeof detailsSchema>;


function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

/**
 * The subscriber's own account page: who they are, change their password, switch
 * the theme and sign out. Clients get no other page, so this is their settings screen.
 */
export function ClientProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ['client-me'], queryFn: clientApi.me });

  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors: detailsErrors },
  } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { fullName: '', phone: '' },
  });

  const name = data?.customer.name || user?.fullName || '';
  const phone = data?.customer.phone ?? user?.phone ?? null;
  const email = user?.email ?? data?.customer.email ?? null;

  // The server holds the real name/phone, so seed the form once it arrives
  useEffect(() => {
    if (!data) return;
    setValue('fullName', data.customer.name || user?.fullName || '');
    setValue('phone', data.customer.phone ?? user?.phone ?? '');
  }, [data, user, setValue]);

  const saveDetails = useMutation({
    mutationFn: (values: DetailsValues) =>
      authApi.updateProfile({
        fullName: values.fullName.trim(),
        phone: values.phone.trim() || undefined,
        avatarUrl: avatarUrl,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      void queryClient.invalidateQueries({ queryKey: ['client-me'] });
      notifySuccess('Details saved', 'Your profile has been updated.');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image size must be less than 2MB.');
      return;
    }
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const signOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="relative isolate -mx-4 -mt-2 min-h-[100dvh] pb-10">
      <img
        src="/images/splash-savanna.jpg"
        alt=""
        aria-hidden
        className="fixed inset-0 -z-20 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/75"
      />

      {/* Back to the dashboard */}
      <header className="sticky top-0 z-30 -mx-4 flex items-center gap-3 bg-black/55 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black pl-2 text-white active:scale-90"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-semibold text-white">My Account</h1>
        <span className="h-12 w-12 shrink-0" aria-hidden />
      </header>

      <div className="px-4 pt-5">
        {/* Identity */}
        <section className="flex flex-col items-center text-center">
          <div className="relative">
            <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/85 bg-[radial-gradient(circle_at_30%_24%,#A9E06D_0%,#57A81E_38%,#2F7A0C_70%,#17540A_100%)] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_-3px_6px_rgba(0,0,0,0.35)]">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/45 to-white/0"
              />
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="relative h-full w-full object-cover" />
              ) : (
                <span className="relative -skew-x-12 text-[30px] font-black leading-none text-white [text-shadow:0_2px_3px_rgba(0,0,0,0.45)]">
                  {initials(name).slice(0, 1)}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white ring-2 ring-white/80 transition-transform active:scale-90"
              aria-label="Change photo"
            >
              <Camera className="h-4 w-4" aria-hidden />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <h2 className="mt-4 text-[18px] font-semibold text-white">{name}</h2>
          {phone && <p className="text-[13px] text-white/75">{phone}</p>}
          {email && <p className="text-[13px] text-white/75">{email}</p>}
          <p className="mt-1 text-[11px] text-white/50">PNG, JPG or WEBP · up to 2MB</p>
          {avatarError && <p className="mt-1 text-xs text-red-300">{avatarError}</p>}
        </section>

        {/* Editable details */}
        <section className="mt-6 rounded-lg border border-white/15 bg-black/55 p-4 backdrop-blur-md">
          <h3 className="text-[15px] font-semibold text-white">My details</h3>
          <form
            className="mt-3 space-y-3"
            onSubmit={handleSubmit((values) => saveDetails.mutate(values))}
            noValidate
          >
            <div>
              <label htmlFor="client-fullName" className="mb-1 block text-[12px] font-medium text-white/80">
                Full name
              </label>
              <input
                id="client-fullName"
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                {...register('fullName')}
              />
              {detailsErrors.fullName && (
                <p className="mt-1 text-xs text-red-300">{detailsErrors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="client-phone" className="mb-1 block text-[12px] font-medium text-white/80">
                Phone number
              </label>
              <input
                id="client-phone"
                type="tel"
                inputMode="tel"
                placeholder="0712 345 678"
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/40"
                {...register('phone')}
              />
              {detailsErrors.phone && <p className="mt-1 text-xs text-red-300">{detailsErrors.phone.message}</p>}
            </div>

            {saveDetails.isError && (
              <p className="rounded-xl bg-red-500/15 px-4 py-3 text-[13px] text-red-200">
                {apiErrorMessage(saveDetails.error)}
              </p>
            )}

            <button
              type="submit"
              disabled={saveDetails.isPending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8BC53F] text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden />
              {saveDetails.isPending ? 'Saving…' : 'Save details'}
            </button>
          </form>
          <p className="mt-3 text-[11px] text-white/60">
            {data?.business.name ?? 'Your provider'} may need to confirm changes to your account number.
          </p>
        </section>

        {/* Change password */}
        <section className="mt-4 rounded-[26px] border border-white/15 bg-black/55 p-4 backdrop-blur-md">
          <h3 className="text-[15px] font-semibold text-white">Change password</h3>
          <div className="mt-3">
            <ChangePasswordForm dark />
          </div>
        </section>

        {/* Appearance */}
        <section className="mt-4 rounded-[26px] border border-white/15 bg-black/55 p-2 backdrop-blur-md">
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-transform active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
              {isDark ? <Moon className="h-5 w-5" aria-hidden /> : <Sun className="h-5 w-5 text-amber-300" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-white">Dark mode</span>
              <span className="block text-[12px] text-white/70">{isDark ? 'On' : 'Off'}</span>
            </span>
            <span
              className={cn('relative h-7 w-[52px] shrink-0 rounded-full transition-colors')}
              style={{ backgroundColor: isDark ? '#8BC53F' : 'rgba(255,255,255,0.25)' }}
              aria-hidden
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200',
                  isDark ? 'translate-x-6' : 'translate-x-0',
                )}
              />
            </span>
          </button>
        </section>

        {/* Sign out */}
        <section className="mt-4">
          <button
            type="button"
            onClick={() => requestLogout()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full py-2 text-[12px] text-white/60 active:opacity-70"
          >
            Sign out without asking
          </button>
        </section>
      </div>
    </div>
  );
}