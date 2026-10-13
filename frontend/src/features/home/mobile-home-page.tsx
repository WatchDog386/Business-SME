import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, LifeBuoy, MessageCircle, Receipt } from 'lucide-react';
import { Brand } from '@/components/layout/brand';

const cards = [
  { icon: Receipt, title: 'Sales', text: 'Record sales and payments in seconds.', tile: 'bg-brand-600' },
  { icon: LifeBuoy, title: 'Self service', text: 'Get help with your account any time.', tile: 'bg-brand-700' },
];

/** Solid green gradient used for the hero card and the Login buttons. */
const greenGradient = 'bg-gradient-to-br from-[#5A9A1A] to-[#031E45]';

/**
 * Mobile landing page for signed-out users, shown after logging out.
 * Only rendered on phone-width screens; desktop keeps going straight to sign-in.
 *
 * Layout: the photo fills the top quarter edge to edge (under the status bar)
 * with the logo on it. A solid white sheet rises over the bottom of the photo
 * and holds the welcome text, a green hero card, feature cards and the Login button.
 */
export function MobileHomePage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-brand-900">
      {/* Photo behind the whole page, so the sheet can be see-through */}
      <img
        src="/images/splash-savanna.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Logo sits on the photo, top quarter of the screen */}
      <div className="relative flex h-[36dvh] min-h-[230px] w-full shrink-0 items-center justify-center pt-[env(safe-area-inset-top)]">
        <Brand onDark size="lg" />
      </div>

      {/* Translucent sheet: the photo shows through */}
      <main className="relative -mt-8 flex flex-1 flex-col rounded-t-2xl bg-white/60 px-5 backdrop-blur-[2px] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 text-slate-900 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
        <div className="mx-auto h-1 w-12 rounded-full bg-slate-300" aria-hidden />

        <h1 className="mt-5 text-center text-[22px] font-semibold tracking-tight">Welcome to Optimas</h1>

        {/* Solid green hero card */}
        <div className={`relative mt-5 flex h-36 flex-col justify-center overflow-hidden rounded-3xl px-5 text-white ${greenGradient}`}>
          <h2 className="text-lg font-semibold">Run your business</h2>
          <p className="mt-1 max-w-[70%] text-sm leading-snug text-white/90">
            Sign in to record sales, track expenses and see your numbers in one place.
          </p>
          <span className="absolute right-5 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/20">
            <Briefcase className="h-6 w-6" aria-hidden />
          </span>
        </div>

        {/* White feature cards with solid icon tiles */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${card.tile}`}>
                <card.icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="mt-3 text-sm font-semibold">{card.title}</h2>
              <p className="mt-1 text-xs leading-snug text-slate-500">{card.text}</p>
            </div>
          ))}
        </div>

        {/* Help strip */}
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <MessageCircle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="text-xs text-slate-500">Our support team is here for you.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden />
        </div>

        {/* Solid green Login and fingerprint buttons */}
        <div className="mt-6 pb-4">
          <Link
            to="/login"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#3A8F91] text-[20px] font-medium text-white shadow-none transition-colors hover:bg-[#2F7F81] active:bg-[#2F7F81]"
          >
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
