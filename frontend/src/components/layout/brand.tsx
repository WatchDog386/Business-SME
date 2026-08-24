import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

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
  const imgSize =
    size === 'lg' ? 'h-32 w-32' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src={logo}
        alt="Biashara logo"
        className={cn('shrink-0 rounded-xl object-contain', imgSize)}
      />
      {!compact && (
        <div className="leading-tight">
          <p
            className={cn(
              'font-display text-sm font-medium tracking-tight',
              onDark ? 'text-white' : 'text-foreground',
            )}
          >
            Biashara
          </p>
          <p
            className={cn(
              'text-[10px] font-medium',
              onDark ? 'text-white/70' : 'text-foreground-5',
            )}
          >
            Your business manager
          </p>
        </div>
      )}
    </div>
  );
}