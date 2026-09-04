import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import add1 from '../../../assets/add.png';
import add2 from '../../../assets/add2.png';
import add3 from '../../../assets/add3.png';
import add4 from '../../../assets/add4.png';

const images = [add1, add2, add3, add4];

const CARD_HEIGHT = 280;
const SLIDE_GAP = 0;

interface BannerCardProps {
  image: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function BannerCard({ image, index, isActive, onClick }: BannerCardProps) {
  const titles = [
    'Boost Your Sales',
    'Smart Inventory',
    'Instant Reports',
    'Team Insights',
  ];
  const subtitles = [
    'Track daily revenue and grow faster',
    'Never run out of stock again',
    'Profit & loss at your fingertips',
    'Know who\'s selling what',
  ];
  const accentColors = [
    'bg-accent/10 border-accent/20',
    'bg-emerald-500/10 border-emerald-500/20',
    'bg-amber-500/10 border-amber-500/20',
    'bg-sky-500/10 border-sky-500/20',
  ];
  const gradientColors = [
    'from-emerald-600/70 via-emerald-700/50 to-emerald-900/80',
    'from-emerald-600/70 via-emerald-700/50 to-emerald-900/80',
    'from-amber-600/70 via-amber-700/50 to-amber-900/80',
    'from-sky-600/70 via-sky-700/50 to-sky-900/80',
  ];
  const ringColors = [
    'ring-emerald-400',
    'ring-emerald-400',
    'ring-amber-400',
    'ring-sky-400',
  ];
  const shadowColors = [
    '0 20px 40px -12px rgb(0 177 64 / 0.4)',
    '0 20px 40px -12px rgb(16 185 129 / 0.4)',
    '0 20px 40px -12px rgb(217 119 6 / 0.4)',
    '0 20px 40px -12px rgb(2 132 199 / 0.4)',
  ];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex-shrink-0 rounded-2xl border overflow-hidden transition-all duration-500 cursor-pointer',
        'hover:shadow-xl hover:-translate-y-1',
        isActive ? `ring-2 ${ringColors[index]} scale-[1.02]` : '',
        `w-full h-[${CARD_HEIGHT}px]`,
        accentColors[index]
      )}
      style={{ boxShadow: isActive ? shadowColors[index] : undefined }}
    >
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${gradientColors[index]}`} />
      </div>

      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        <div className="pt-2">
          <h3 className="text-lg font-semibold text-white leading-tight">{titles[index]}</h3>
          <p className="mt-1 text-sm text-white/80 leading-relaxed">{subtitles[index]}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-xs text-white/60 uppercase tracking-wide">Featured</span>
        </div>
      </div>
    </div>
  );
}

export function AdsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length, isHovered]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: currentIndex * el.clientWidth, behavior: 'smooth' });
  }, [currentIndex]);

  const scrollToIndex = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    setCurrentIndex(idx);
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="space-y-4" aria-label="Featured updates">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Featured updates</h2>
        <span className="text-xs text-foreground-4">Swipe to explore</span>
      </div>

      <div
        ref={trackRef}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: 'x mandatory',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        <div className="flex" style={{ gap: SLIDE_GAP }}>
          {images.map((img, idx) => (
            <BannerCard
              key={idx}
              image={img}
              index={idx}
              isActive={idx === currentIndex % images.length}
              onClick={() => scrollToIndex(idx)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 pt-2" role="tablist" aria-label="Featured updates pagination">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              idx === currentIndex % images.length
                ? 'w-8 bg-accent'
                : 'w-2 bg-foreground-5 hover:bg-foreground-4'
            )}
            aria-label={`Go to feature ${idx + 1}`}
            role="tab"
            aria-selected={idx === currentIndex % images.length}
          />
        ))}
      </div>
    </section>
  );
}