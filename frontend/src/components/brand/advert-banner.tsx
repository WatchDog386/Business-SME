import advert from '@/assets/advert.jpeg';
import { cn } from '@/lib/utils';

/** The Optimas paybill banner (paybill 4092707, account FBI…, support numbers). */
export function AdvertBanner({ className }: { className?: string }) {
  return (
    <img
      src={advert}
      alt="Pay with M-Pesa: Paybill 4092707, account number is your FBI account. Support: 0741874200 or 0709000860, www.optimaswifi.co.ke"
      width={892}
      height={330}
      loading="lazy"
      decoding="async"
      className={cn('block h-auto w-full rounded-2xl shadow-sm', className)}
    />
  );
}
