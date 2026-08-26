import { useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

const ads = [
  {
    title: 'Grow Your SME with M-Pesa & OmniTrack',
    image: 'https://i.pinimg.com/736x/12/c7/e2/12c7e2bffeb946a611862b2d29f53073.jpg',
    badge: 'Featured',
    bgClass: 'bg-gradient-to-br from-indigo-600 via-violet-800 to-slate-950',
  },
  {
    title: 'Unlock Business Loans Instantly',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
    badge: 'Partner Offer',
    bgClass: 'bg-gradient-to-br from-blue-600 via-indigo-800 to-slate-950',
  },
  {
    title: 'Zero-Paper Tax & Compliance',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80',
    badge: 'Compliance Pro',
    bgClass: 'bg-gradient-to-br from-amber-600 via-orange-800 to-yellow-950',
  },
];

const SLIDE_GAP = 12; // px between slides

export function AdsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync the active dot while the user scrolls/swipes manually
  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const step = el.clientWidth + SLIDE_GAP;
    const idx = Math.min(
      ads.length - 1,
      Math.max(0, Math.round(el.scrollLeft / step)),
    );
    setCurrentIndex(idx);
  };

  // Centre the chosen slide (flush at the ends)
  const scrollToIndex = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * (el.clientWidth + SLIDE_GAP), behavior: 'smooth' });
    setCurrentIndex(idx);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-[14px] font-medium tracking-tight text-foreground">Featured updates</h2>

      {/* Full-width cards — same footprint as the featured summary card */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ads.map((ad, idx) => (
          <button
            key={ad.title}
            onClick={() => scrollToIndex(idx)}
            aria-label={ad.title}
            style={{ width: '100%', marginRight: SLIDE_GAP }}
            className={`relative h-44 shrink-0 snap-center overflow-hidden rounded-3xl text-left shadow-lift sm:h-52 ${ad.bgClass}`}
          >
            {/* Full-clarity image with a light scrim for legibility */}
            <img
              src={ad.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />

            <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
              <span className="flex w-fit items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> {ad.badge}
              </span>

              <h3 className="text-sm sm:text-base font-medium tracking-tight text-white">
                {ad.title}
              </h3>

              <div className="text-[10px] font-medium text-white/50">
                OmniTrack Showcase
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Centered dots below card */}
      <div className="flex justify-center gap-2 pt-1">
        {ads.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-6 bg-accent' : 'w-2 bg-foreground-5'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
