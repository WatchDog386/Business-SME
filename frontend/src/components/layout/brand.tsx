import { cn } from '@/lib/utils';
import logo from '@/assets/optima-logo.png';
import logoLight from '@/assets/optima-logo-light.png';

export function Brand({
  className,
  compact = false,
  onDark = false,
  size = 'md',
}: {
  className?: string;
  compact?: boolean;
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  // The wordmark is ~4.17:1, so it is sized by width with height derived
  // from the intrinsic aspect ratio (never a fixed square).
  const imgSize =
    size === 'lg' ? 'w-40' : size === 'sm' ? 'w-24' : 'w-28';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src={onDark ? logoLight : logo}
        alt="Optima logo"
        width={1200}
        height={288}
        className={cn('shrink-0 object-contain', imgSize)}
      />
      {!compact && (
        <div className="leading-tight">
          <p
            className={cn(
              'font-display text-sm font-medium tracking-tight',
              onDark ? 'text-white' : 'text-foreground',
            )}
          >
            Optimas
          </p>
          <p
            className={cn(
              'text-[10px] font-medium',
              onDark ? 'text-white/70' : 'text-foreground-5',
            )}
          >
            Technologies Ltd
          </p>
        </div>
      )}
    </div>
  );
}