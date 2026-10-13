import { Link } from 'react-router-dom';
import { useId } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Brand } from '@/components/layout/brand';
import { CARD_THEMES, CardPatternLayer } from '@/components/brand/fiber-card';
import { usePhotoStatusBar } from '@/hooks/use-photo-status-bar';

const cards = [
  { img: '/icon1.png', title: 'Sales', text: 'Record sales and payments in seconds.' },
  { img: '/icon2.png', title: 'Self service', text: 'Get help with your account any time.' },
];


/**
 * Mobile landing page for signed-out users, shown after logging out.
 * Only rendered on phone-width screens; desktop keeps going straight to sign-in.
 *
 * Layout: the photo fills the top quarter edge to edge (under the status bar)
 * with the logo on it. A solid white sheet rises over the bottom of the photo
 * and holds the welcome text, a green hero card, feature cards and the Login button.
 */
export function MobileHomePage() {
  const uid = useId().replace(/:/g, '');

  usePhotoStatusBar();

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">
      {/* Photo covers the whole screen, from under the status bar down behind the sheet */}
      <img
        src="/images/splash-savanna.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Logo on the photo. The photo's top is a deep blue dusk sky, so the light wordmark reads */}
      <div className="relative flex min-h-[170px] w-full flex-1 items-center justify-center pt-[env(safe-area-inset-top)]">
        <Brand onDark size="lg" />
      </div>

      {/* Whitish frosted sheet: the photo shows faintly through; sized so Login is always fully visible */}
      <main className="relative flex max-h-[calc(100%-170px)] shrink-0 flex-col rounded-t-3xl bg-white/80 px-5 backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-slate-900 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
        <div className="mx-auto h-1 w-12 shrink-0 rounded-full bg-slate-300" aria-hidden />

        {/* Middle content scrolls only on very short screens; Login stays pinned below */}
        <div className="-mx-5 min-h-0 flex-1 overflow-y-auto px-5">

        <h1 className="mt-4 text-center text-[22px] font-semibold tracking-tight">Welcome to Optimas</h1>

        {/* Solid green hero card */}
        <div className="relative mt-4 flex h-32 flex-col justify-center overflow-hidden rounded-3xl px-5 text-white">
          {/* Same background as the Today's revenue card */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 144" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <defs>
              <linearGradient id={`${uid}-green`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={CARD_THEMES.sales.colors[0]} />
                <stop offset="55%" stopColor={CARD_THEMES.sales.colors[1]} />
                <stop offset="100%" stopColor={CARD_THEMES.sales.colors[2]} />
              </linearGradient>
            </defs>
            <rect width="400" height="144" fill={`url(#${uid}-green)`} />
            <CardPatternLayer theme={CARD_THEMES.sales} w={400} h={144} uid={uid} showChip={false} />
          </svg>
          <h2 className="relative text-lg font-semibold">Run your business</h2>
          <p className="relative mt-1 max-w-[70%] text-sm leading-snug text-white/90">
            Sign in to record sales, track expenses and see your numbers in one place.
          </p>
          <img src="/icon3.png" alt="" aria-hidden className="absolute right-4 top-1/2 h-28 w-28 -translate-y-1/2 object-contain" />
        </div>

        {/* White feature cards with solid icon tiles */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <img src={card.img} alt="" aria-hidden className="h-12 w-12 object-contain" />
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
        </div>

        {/* Login button, always in full view at the bottom of the sheet */}
        <div className="shrink-0 pt-4">
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
