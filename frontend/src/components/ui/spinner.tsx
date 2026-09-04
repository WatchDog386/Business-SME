import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('h-5 w-5 animate-spin text-accent', className)}
      aria-label="Loading"
    />
  );
}

export function PageLoader({
  message = 'Loading',
  inline = false,
}: {
  message?: string;
  inline?: boolean;
}) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 380);
    return () => clearInterval(id);
  }, []);
  const dotStr = '.'.repeat(dots);

  const content = (
    <p className="text-center text-xl font-bold tracking-tight text-foreground">
      {message}
      <span className="inline-block w-7 text-left">{dotStr}</span>
    </p>
  );

  if (inline) {
    return <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface px-4">
      {content}
    </div>
  );
}