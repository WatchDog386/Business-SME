import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const ads = [
  {
    title: 'Grow Your SME with M-Pesa & Biashara',
    description: 'Instant reconciliation, automated stock tracking, and zero paperwork for Kenyan businesses.',
    image: 'https://images.unsplash.com/photo-1556742049-0a67d5e0f7ef?auto=format&fit=crop&w=800&q=80',
    badge: 'Featured',
    bgClass: 'bg-gradient-to-br from-emerald-600 via-emerald-800 to-green-950',
  },
  {
    title: 'Unlock Business Loans Instantly',
    description: 'Access working capital up to KSh 500k based on your verified sales history.',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
    badge: 'Partner Offer',
    bgClass: 'bg-gradient-to-br from-blue-600 via-indigo-800 to-slate-950',
  },
  {
    title: 'Zero-Paper Tax & Compliance',
    description: 'Generate KRA-ready sales and profit reports in one tap. Stay audit-ready effortlessly.',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80',
    badge: 'Compliance Pro',
    bgClass: 'bg-gradient-to-br from-amber-600 via-orange-800 to-yellow-950',
  },
];

export function AdsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = ads[currentIndex];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-foreground tracking-tight">Featured updates</h2>
      <div className={`relative overflow-hidden rounded-3xl border border-[#2A2A2A] ${current.bgClass} p-6 shadow-xl text-white transition-all duration-500`}>
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src={current.image}
            alt={current.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className={`relative z-10 flex flex-col justify-between h-32 sm:h-36 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> {current.badge}
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight drop-shadow-sm">
              {current.title}
            </h3>
            <p className="mt-1 text-xs text-zinc-200 font-medium line-clamp-2 max-w-xl">
              {current.description}
            </p>
          </div>

          <div className="text-[11px] font-semibold text-zinc-400">
            Biashara Showcase
          </div>
        </div>
      </div>

      {/* Centered Dots below card */}
      <div className="flex justify-center gap-2 pt-1">
        {ads.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setFade(false);
              setTimeout(() => {
                setCurrentIndex(idx);
                setFade(true);
              }, 300);
            }}
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
