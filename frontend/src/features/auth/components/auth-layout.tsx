import { Link } from 'react-router-dom';
import { BarChart3, Wallet, Users, PackageCheck, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/layout/brand';
import { WaveBackground } from '@/components/layout/wave-background';

const highlights = [
  { icon: BarChart3, text: 'Know your daily sales, expenses and profit' },
  { icon: Wallet, text: 'Track money customers owe you' },
  { icon: Users, text: 'Keep every customer in one place' },
  { icon: PackageCheck, text: 'See what is running out of stock' },
];

export function AuthLayout({
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
  return (
    <div className="grid min-h-screen bg-surface-2 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-10 lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-black/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />

        <div className="relative">
          <Brand compact onDark size="lg" />
        </div>

        <div className="relative space-y-7">
          <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-white">
            Run your business.
            <br />
            Know your numbers.
            <br />
            <span className="text-brand-100">Grow faster.</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/85">
            The simple business manager for Kenyan SMEs. Replace your notebook,
            calculator and M-Pesa messages with one app.
          </p>

          <ul className="space-y-4 pt-2">
            {highlights.map((item, i) => (
              <li
                key={item.text}
                className="flex animate-fade-up items-center gap-3 text-sm text-white/95"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm backdrop-blur">
                  <item.icon className="h-4.5 w-4.5 text-white" aria-hidden />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between">
          <p className="text-xs text-white/70">
            Made for Kenyan businesses — salons, shops, boutiques, restaurants and more.
          </p>
          <span className="flex items-center gap-1.5 text-xs font-medium text-white/80">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Secure &amp; private
          </span>
        </div>
      </div>

      <div className="relative flex flex-col justify-start sm:justify-center px-6 pt-10 pb-8 sm:px-8 sm:py-10 lg:bg-transparent">
        <WaveBackground className="fixed" />

        <div className="mb-6 flex justify-center lg:hidden">
          <Brand compact size="lg" />
        </div>

        <div className="mx-auto w-full max-w-sm space-y-6">
          {(title || subtitle) && (
            <div className="space-y-1.5 text-center">
              {title && (
                <h2 className="text-xl sm:text-3xl font-medium tracking-tight text-foreground">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm font-medium text-foreground-3">{subtitle}</p>
              )}
            </div>
          )}
          {children}

          {!hideFooterLinks && (
            <p className="text-center text-xs text-foreground-4">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          )}
        </div>
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
