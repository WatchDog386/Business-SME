import { Link } from 'react-router-dom';
import { HomePhoto } from '@/components/brand/home-photo';
import { useId } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Brand } from '@/components/layout/brand';
import { CARD_THEMES, CardPatternLayer } from '@/components/brand/fiber-card';
import { usePhotoStatusBar } from '@/hooks/use-photo-status-bar';
import { useTheme } from '@/lib/theme';

const cards = [
  { img: '/icon1.png', title: 'Sales', text: 'Record sales and payments in seconds.' },
  { img: '/icon2.png', title: 'Self service', text: 'Get help with your account any time.' },
];


/**
 * Mobile landing page for signed-out users, shown after logging out.
 * Only rendered on phone-width screens; desktop keeps going straight to sign-in.
 *
 * Layout: the photo fills the top quarter edge to edge (under the status bar)
 * with the logo on it. The sheet below it follows the chosen theme: the
 * subscriber app's dark panel in dark mode, the frosted white sheet in light.
 * It holds the welcome text, a green hero card, feature cards and the Login button.
 */
export function MobileHomePage() {
  const uid = useId().replace(/:/g, '');
  const [theme] = useTheme();
  const dark = theme === 'dark';

  usePhotoStatusBar();

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">
      {/* Photo covers the whole screen, from under the status bar down behind the sheet */}
      <HomePhoto className="absolute inset-0 h-full w-full object-cover" />

      {/* White logo and wordmark stay readable over the photo. */}
      <div className="relative flex min-h-[170px] w-full flex-1 items-center justify-center pb-10 pt-[var(--sat)]">
        <Brand size="lg" />
      </div>

      {/* The sheet: the subscriber app's dark panel in dark mode, frosted white in light */}
      <main
        className={
          'relative flex max-h-[calc(100%-170px)] shrink-0 flex-col rounded-t-3xl px-5 pb-[max(1rem,var(--sab))] pt-3 ' +
          (dark
            ? 'border-t border-white/15 bg-gradient-to-b from-black/70 via-black/45 to-black/75 text-white shadow-[0_-10px_24px_rgba(0,0,0,0.45)]'
            : 'bg-white/55 text-slate-900 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]')
        }
      >
        <div className={dark ? 'mx-auto h-1 w-12 shrink-0 rounded-full bg-white/40' : 'mx-auto h-1 w-12 shrink-0 rounded-full bg-slate-300'} aria-hidden />

        {/* Middle content scrolls only on very short screens; Login stays pinned below */}
        <div className="-mx-5 min-h-0 flex-1 overflow-y-auto px-5">

        <h1 className={dark ? 'mt-4 text-center text-[22px] font-semibold tracking-tight text-white' : 'mt-4 text-center text-[22px] font-semibold tracking-tight text-slate-900'}>
          Welcome to Optimas
        </h1>

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

        {/* Feature cards, each with a glossy green icon in the bottom-right corner */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className={
                'relative flex min-h-[148px] flex-col overflow-hidden rounded-2xl p-4 ' +
                (dark
                  ? 'border border-white/15 bg-[#1E1E1E] shadow-sm'
                  : 'border border-slate-200 bg-white shadow-sm')
              }
            >
              <h2 className={dark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>{card.title}</h2>
              <p className={dark ? 'mt-1 max-w-[72%] text-xs leading-snug text-white/70' : 'mt-1 max-w-[72%] text-xs leading-snug text-slate-500'}>
                {card.text}
              </p>
              {/* The PNG is a black silhouette, so it is masked to take the glossy green fill */}
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 right-2 h-20 w-20 [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [filter:drop-shadow(0_4px_7px_rgba(15,23,42,0.4))]"
                style={{
                  background:
                    'radial-gradient(circle at 32% 26%, #A9E06D 0%, #63AD18 40%, #3F7E08 72%, #295704 100%)',
                  WebkitMaskImage: `url(${card.img})`,
                  maskImage: `url(${card.img})`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Help strip */}
        <Link
          to="/help"
          aria-label="Open help and support"
          className={
            'mt-3 flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-transform active:scale-[0.99] ' +
            (dark ? 'border border-white/15 bg-[#1E1E1E] shadow-sm' : 'border border-slate-200 bg-white shadow-sm')
          }
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <MessageCircle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className={dark ? 'text-sm font-semibold text-white' : 'text-sm font-semibold text-slate-900'}>Need help?</p>
            <p className={dark ? 'text-xs text-white/70' : 'text-xs text-slate-500'}>Our support team is here for you.</p>
          </div>
          <ArrowRight className={dark ? 'h-4 w-4 text-white/60' : 'h-4 w-4 text-slate-400'} aria-hidden />
        </Link>
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
