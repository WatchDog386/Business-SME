import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import logo from '@/assets/optima-logo.png';
import { UserRound } from 'lucide-react';
import { readRememberedAvatar } from '@/stores/auth';

export function AuthLayout({
  title,
  desktopTitle,
  mobileTitle,
  subtitle,
  desktopSubtitle,
  hideLabelsOnMobile,
  hideFooterLinks,
  hideMobileFooter,
  children,
}: {
  title?: string;
  /** Heading on the desktop card, if it should differ from the default. */
  desktopTitle?: string;
  /** Heading on phones, if it should differ from the default. */
  mobileTitle?: string;
  subtitle?: string;
  /** Subtitle on desktop, if it should differ from the default. */
  desktopSubtitle?: string;
  /** Phones show placeholder-only fields; labels stay for screen readers. */
  hideLabelsOnMobile?: boolean;
  hideFooterLinks?: boolean;
  /** Drop the small print under the form on phones. */
  hideMobileFooter?: boolean;
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <DesktopAuthLayout title={desktopTitle ?? title} subtitle={desktopSubtitle ?? subtitle} hideFooterLinks={hideFooterLinks}>
        {children}
      </DesktopAuthLayout>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 pb-10 pt-[max(9rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" className="flex justify-center" aria-label="Optimas home">
          <img src={logo} alt="Optima logo" width={1200} height={288} className="w-36 object-contain" />
        </Link>

        {(title || mobileTitle || subtitle) && (
          <div className="mt-14">
            {(mobileTitle ?? title) && (
              <h1 className="text-3xl font-normal tracking-tight text-slate-800">{mobileTitle ?? title}</h1>
            )}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}

        {/* Muted, borderless fields as in the mobile mock-ups */}
        <div
          className={cn(
            'mt-6 [&_input]:!rounded-lg [&_input]:!border-transparent [&_input]:!bg-slate-100 [&_input]:!text-slate-600 [&_input]:!shadow-none [&_input]:placeholder:text-slate-400',
            hideLabelsOnMobile && '[&_label]:sr-only',
          )}
        >
          {children}
        </div>

        {!hideFooterLinks && !hideMobileFooter && (
          <p className="mt-10 text-center text-xs text-slate-400">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        )}
      </div>
    </div>
  );
}

/** City skyline, bundled locally (Unsplash photo-1477959858617; Unsplash licence, free for commercial use). */
const CITY_PHOTO = '/images/login-city.jpg';

/**
 * Desktop sign-in: a blue-tinted city skyline fills the screen, with a
 * centred column — round logo badge, greeting, pill fields, charcoal button.
 */
function DesktopAuthLayout({
  title,
  subtitle,
  hideFooterLinks,
  children,
}: {
  title?: string;
  subtitle?: string;
  hideFooterLinks?: boolean;
  children: React.ReactNode;
}) {
  // Generic user icon until someone on this device has uploaded a photo.
  const avatar = readRememberedAvatar();
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#2f7fc4] px-8">
      <img src={CITY_PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
      <div className="absolute inset-0 bg-[#3b8fd6]/40 mix-blend-multiply" aria-hidden />
      <div className="absolute inset-0 bg-[#3a8ad4]/40" aria-hidden />

      <div className="relative flex w-full max-w-[22rem] flex-1 flex-col items-center justify-center py-12 text-center">
        <Link
          to="/"
          aria-label="Optimas home"
          className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white shadow-xl ring-4 ring-white/30"
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-14 w-14 text-neutral-500" strokeWidth={1.75} aria-hidden />
          )}
        </Link>
        {title && <h1 className="mt-4 text-3xl font-bold tracking-tight text-white drop-shadow">{title}</h1>}
        {subtitle && <p className="mt-2 text-base text-white/85">{subtitle}</p>}

        {/* White pill fields and a charcoal button, as in the mock-up */}
        <div className="mt-8 w-full text-left [&_.auth-link]:!text-white [&_.auth-link]:!font-medium [&_.auth-link:hover]:!underline [&_input]:!h-12 [&_input]:!rounded-full [&_input]:!border-transparent [&_input]:!bg-white [&_input]:!text-base [&_input]:!text-slate-900 [&_input]:shadow-lg [&_input]:placeholder:font-semibold [&_input]:placeholder:text-neutral-600 [&_label]:sr-only [&_[role=alert]]:shadow-lg">
          {children}
        </div>
      </div>

      <div className="relative space-y-1 pb-10 text-center">
        <p className="text-lg font-medium text-white">No account? Ask your Optimas administrator.</p>
        <p className="text-xs text-white/75">
          © {new Date().getFullYear()} Optimas Technologies Ltd. Authorised staff only.
          {!hideFooterLinks && ' By continuing you agree to our Terms and Privacy Policy.'}
        </p>
      </div>
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  to,
}: {
  text: string;
  linkText: string;
  to: string;
}) {
  return (
    <p className="mt-6 text-center text-sm text-foreground-3">
      {text}{' '}
      <Link
        to={to}
        className="font-medium text-brand-600 transition-colors hover:text-brand-700"
      >
        {linkText}
      </Link>
    </p>
  );
}
