import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Moon, Sun } from 'lucide-react';
import { clientApi } from '@/api/endpoints';
import { ChangePasswordForm } from '@/features/auth/components/change-password-form';
import { useTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth';
import { requestLogout } from '@/components/layout/session-timeout';
import { cn } from '@/lib/utils';


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
  const logout = useAuthStore((s) => s.logout);
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';

  const { data } = useQuery({ queryKey: ['client-me'], queryFn: clientApi.me });

  const name = data?.customer.name || user?.fullName || '';
  const phone = data?.customer.phone ?? user?.phone ?? null;
  const email = user?.email ?? data?.customer.email ?? null;

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
          <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/85 bg-[radial-gradient(circle_at_30%_24%,#A9E06D_0%,#57A81E_38%,#2F7A0C_70%,#17540A_100%)] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_-3px_6px_rgba(0,0,0,0.35)]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/45 to-white/0"
            />
            <span className="relative -skew-x-12 text-[30px] font-black leading-none text-white [text-shadow:0_2px_3px_rgba(0,0,0,0.45)]">
              {initials(name).slice(0, 1)}
            </span>
          </span>
          <h2 className="mt-4 text-[18px] font-semibold text-white">{name}</h2>
          {phone && <p className="text-[13px] text-white/75">{phone}</p>}
          {email && <p className="text-[13px] text-white/75">{email}</p>}
        </section>

        {/* Account details */}
        <section className="mt-6 rounded-[26px] border border-white/15 bg-black/55 p-4 backdrop-blur-md">
          <h3 className="text-[15px] font-semibold text-white">Details</h3>
          <dl className="mt-3 space-y-2.5 text-[14px]">
            <Row label="Name" value={name || '—'} />
            <Row label="Phone" value={phone || 'Not set'} />
            <Row label="Email" value={email || 'Not set'} />
            <Row label="Provider" value={data?.business.name ?? '—'} />
          </dl>
          <p className="mt-3 text-[11px] text-white/60">
            Ask {data?.business.name ?? 'your provider'} to change your name, phone or email.
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-white/70">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-white">{value}</dd>
    </div>
  );
}