import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import type { DashboardData } from '@/api/types';
import { cn, formatKES } from '@/lib/utils';
import phoneImg from '@/assets/phone.png';
import phone2Img from '@/assets/phone2.png';
import phone3Img from '@/assets/phone3.png';

const phoneSlides = [phoneImg, phone2Img, phone3Img];

// Per-slide zoom so every artwork renders at the same visual size
// (phone2.png is near-square, so it needs less zoom than the taller phone.png)
const phoneScales = [1.25, 0.88, 1];

// Per-slide vertical nudge (positive pushes the artwork down, cropping its bottom)
const phoneYOffsets = ['0%', '0%', '0%'];

export function FeaturedCard({ data }: { data: DashboardData }) {
  const { today } = data;
  const isProfitable = today.netProfit >= 0;
  const [hidden, setHidden] = useState(() => {
    return localStorage.getItem('biashara_hide_balance') === 'true';
  });
  const [slide, setSlide] = useState(0);
  const navigate = useNavigate();

  // Cycle the hero artwork every 5 seconds
  useEffect(() => {
    const id = setInterval(
      () => setSlide((s) => (s + 1) % phoneSlides.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  const toggleHide = () => {
    const next = !hidden;
    setHidden(next);
    localStorage.setItem('biashara_hide_balance', String(next));
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-700 via-brand-900 to-[#04211a] p-5 shadow-lift sm:p-6">
      {/* Phone mockups as oversized background, sliding in every 5 seconds */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {phoneSlides.map((src, i) => {
          const pos = (i - slide + phoneSlides.length) % phoneSlides.length;
          return (
            <img
              key={src}
              src={src}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-auto origin-bottom-right object-contain transition-all duration-700 ease-out"
              style={{
                transform: `translate(${pos === 0 ? '0%' : pos === 1 ? '100%' : '-100%'}, ${phoneYOffsets[i] ?? '0%'}) scale(${phoneScales[i] ?? 1.25})`,
                opacity: pos === 0 ? 1 : 0,
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-medium tracking-tight text-white">
            Today&apos;s Sales Summary
          </h2>
          <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
            {today.salesCount} sale{today.salesCount === 1 ? '' : 's'} today
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-medium leading-none tracking-tight text-white tabular-nums">
                Ksh
              </span>
              <span
                className={cn(
                  'text-lg font-medium leading-none tracking-tight text-white tabular-nums transition-all duration-200',
                  hidden ? 'blur-md select-none opacity-80' : '',
                )}
              >
                {today.sales > 0 ? formatAmount(today.sales) : '650'}
              </span>
            </div>
            <button
              onClick={toggleHide}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-3 text-sm text-white/70">
            Available net profit:{' '}
            <span
              className={cn(
                'font-semibold tabular-nums transition-all duration-200',
                hidden ? 'blur-sm select-none opacity-80' : '',
                isProfitable ? 'text-emerald-400' : 'text-red-300',
              )}
            >
              {formatKES(today.netProfit)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate('/account')}
            className="rounded-xl bg-white px-8 py-3 text-sm font-medium text-brand-900 shadow-lg transition-colors hover:bg-white/90 active:scale-[0.98]"
          >
            View account details
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-KE');
}
